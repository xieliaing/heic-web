"""Valid sparse container fixtures with media located beyond signed 32-bit offsets.

These exercise seeks and container offsets, not sustained multi-GB throughput.
Run prepare-video-tests.mjs first. Only writes inside .tmp-video.
"""
from pathlib import Path
import os
import struct
import subprocess

ROOT = Path(__file__).resolve().parent.parent / '.tmp-video'
GAP = 2300 * 1024**2


def sparse_file(path, before, header, gap, after):
    with path.open('wb') as out:
        if os.name == 'nt':
            import ctypes
            import msvcrt
            returned = ctypes.c_ulong()
            kernel = ctypes.WinDLL('kernel32', use_last_error=True)
            kernel.DeviceIoControl.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.c_void_p,
                                              ctypes.c_ulong, ctypes.c_void_p, ctypes.c_ulong,
                                              ctypes.POINTER(ctypes.c_ulong), ctypes.c_void_p]
            if not kernel.DeviceIoControl(msvcrt.get_osfhandle(out.fileno()), 0x900C4,
                                          None, 0, None, 0, ctypes.byref(returned), None):
                raise ctypes.WinError(ctypes.get_last_error())
        out.write(before)
        base = out.tell()
        for offset, value in (header if isinstance(header, list) else [(0, header)]):
            out.seek(base + offset)
            out.write(value)
        out.seek(base + gap)
        out.write(after)
    subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                    '-of', 'default=nw=1', str(path)], check=True)
    print(path.name, path.stat().st_size, 'bytes', flush=True)


def mp4(ext, gap=GAP, name=None):
    data = bytearray((ROOT / f'small.{ext}').read_bytes())
    split = struct.unpack_from('>I', data)[0]  # after ftyp

    def patch(start, end):
        offset = start
        while offset < end:
            size, kind = struct.unpack_from('>I4s', data, offset)
            if size < 8:
                raise ValueError('Unexpected box')
            if kind in (b'moov', b'trak', b'mdia', b'minf', b'stbl'):
                patch(offset + 8, offset + size)
            elif kind in (b'stco', b'co64'):
                count = struct.unpack_from('>I', data, offset + 12)[0]
                fmt, width = ('>I', 4) if kind == b'stco' else ('>Q', 8)
                for i in range(count):
                    at = offset + 16 + i * width
                    old = struct.unpack_from(fmt, data, at)[0]
                    struct.pack_into(fmt, data, at, old + gap)
            offset += size
    patch(0, len(data))
    sparse_file(ROOT / (name or f'large.{ext}'), data[:split], struct.pack('>I4s', gap, b'free'), gap, data[split:])


def vint(data, at, identifier=False):
    width = 1
    while not data[at] & (1 << (8 - width)):
        width += 1
    value = int.from_bytes(data[at:at + width], 'big')
    return (value if identifier else value & ((1 << (7 * width)) - 1)), width


def void_header(size):
    return b'\xec' + ((1 << 56) | (size - 9)).to_bytes(8, 'big')


def padding_headers(gap, make_header, chunk=256 * 1024**2):
    result = []
    at = 0
    while at < gap:
        size = min(chunk, gap - at)
        result.append((at, make_header(size)))
        at += size
    return result


def matroska(ext):
    data = bytearray((ROOT / f'small.{ext}').read_bytes())
    at = 0
    while True:
        kind, iw = vint(data, at, True)
        size, sw = vint(data, at + iw)
        body = at + iw + sw
        if kind == 0x18538067:
            data[at + iw:body] = ((1 << (7 * sw + 1)) - 1).to_bytes(sw, 'big')
            break
        at = body + size
    split = None
    at = body
    while at < len(data):
        kind, iw = vint(data, at, True)
        size, sw = vint(data, at + iw)
        end = at + iw + sw + size
        if kind in (0x114D9B74, 0x1C53BB6B):  # indexes become invalid after padding
            total = end - at
            data[at:end] = void_header(total) + bytes(total - 9)
        if kind == 0x1F43B675 and split is None:
            split = at
        at = end
    assert split is not None
    sparse_file(ROOT / f'large.{ext}', data[:split], padding_headers(GAP, void_header), GAP, data[split:])


def avi():
    data = bytearray((ROOT / 'small.avi').read_bytes())
    at = 12
    while at < len(data):
        kind, size = struct.unpack_from('<4sI', data, at)
        if kind == b'LIST' and data[at + 8:at + 12] == b'movi':
            break
        at += 8 + size + (size & 1)
    assert at < len(data)
    struct.pack_into('<I', data, 4, len(data) + GAP - 8)
    sparse_file(ROOT / 'large.avi', data[:at], padding_headers(GAP, lambda n: struct.pack('<4sI', b'JUNK', n - 8), 512 * 1024), GAP, data[at:])


for extension in ('mp4', 'mov'):
    mp4(extension)
for extension in ('mkv', 'webm'):
    matroska(extension)
avi()
mp4('mp4', 4 * 1024**3 - 1024**2, 'near-limit.mp4')
