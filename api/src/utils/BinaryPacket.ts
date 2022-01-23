export const checkAlloc = (writer: any, size: any) => {
  let needed = writer._length + size;
  let chunk = Math.max(Buffer.poolSize / 2, 1024);
  let chunkCount = (needed / chunk) >>> 0;

  if (writer._buffer.length >= needed) return;

  if (needed % chunk > 0) {
    chunkCount += 1;
  }

  let buffer = Buffer.alloc(chunkCount * chunk);
  writer._buffer.copy(buffer, 0, 0, writer._length);
  writer._buffer = buffer;
};

export class BinaryWriter {
  _buffer: any;
  _length: number;
  constructor(size: number) {
    if (!size || size <= 0) {
      size = Buffer.poolSize / 2;
    }

    this._buffer = Buffer.alloc(size);
    this._length = 0;
  }

  writeUInt8(value: number) {
    checkAlloc(this, 1);
    this._buffer[this._length++] = value;
  }

  writeInt8(value: any) {
    checkAlloc(this, 1);
    this._buffer[this._length++] = value;
  }

  writeUInt16(value: number) {
    checkAlloc(this, 2);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
  }

  writeInt16(value: number) {
    checkAlloc(this, 2);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
  }

  writeUInt32(value: number) {
    checkAlloc(this, 4);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
    this._buffer[this._length++] = value >> 16;
    this._buffer[this._length++] = value >> 24;
  }

  writeInt32(value: number) {
    checkAlloc(this, 4);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
    this._buffer[this._length++] = value >> 16;
    this._buffer[this._length++] = value >> 24;
  }

  writeFloat(value: any) {
    checkAlloc(this, 4);
    this._buffer.writeFloatLE(value, this._length, true);
    this._length += 4;
  }

  writeDouble(value: any) {
    checkAlloc(this, 8);
    this._buffer.writeDoubleLE(value, this._length, true);
    this._length += 8;
  }

  writeBytes(data: {
    length: number;
    copy: (arg0: any, arg1: number, arg2: number, arg3: any) => void;
  }) {
    checkAlloc(this, data.length);
    data.copy(this._buffer, this._length, 0, data.length);
    this._length += data.length;
  }

  writeStringUtf8(value: string | NodeJS.ArrayBufferView | ArrayBuffer | SharedArrayBuffer) {
    let length = Buffer.byteLength(value, "utf8");
    checkAlloc(this, length);
    this._buffer.write(value, this._length, "utf8");
    this._length += length;
  }

  writeStringUnicode(value: string | NodeJS.ArrayBufferView | ArrayBuffer | SharedArrayBuffer) {
    let length = Buffer.byteLength(value, "ucs2");
    checkAlloc(this, length);
    this._buffer.write(value, this._length, "ucs2");
    this._length += length;
  }

  writeStringZeroUtf8(value: any) {
    this.writeStringUtf8(value);
    this.writeUInt8(0);
  }

  writeStringZeroUnicode(value: any) {
    this.writeStringUnicode(value);
    this.writeUInt16(0);
  }

  getLength() {
    return this._length;
  }

  reset() {
    this._length = 0;
  }

  toBuffer() {
    return Buffer.concat([this._buffer.slice(0, this._length)]);
  }
}

export class BinaryReader {
  _offset: number;
  _buffer: Buffer;
  constructor(buffer: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>) {
    this._offset = 0;
    this._buffer = Buffer.from(buffer);
  }

  readUInt8() {
    let value = this._buffer.readUInt8(this._offset);
    this._offset++;

    return value;
  }

  readInt8() {
    let value = this._buffer.readInt8(this._offset);
    this._offset++;

    return value;
  }

  readUInt16() {
    let value = this._buffer.readUInt16LE(this._offset);
    this._offset += 2;

    return value;
  }

  readInt16() {
    let value = this._buffer.readInt16LE(this._offset);
    this._offset += 2;

    return value;
  }

  readUInt32() {
    let value = this._buffer.readUInt32LE(this._offset);
    this._offset += 4;

    return value;
  }

  readInt32() {
    let value = this._buffer.readInt32LE(this._offset);
    this._offset += 4;

    return value;
  }

  readFloat() {
    let value = this._buffer.readFloatLE(this._offset);
    this._offset += 4;

    return value;
  }

  readDouble() {
    let value = this._buffer.readDoubleLE(this._offset);
    this._offset += 8;

    return value;
  }

  readBytes(length: number) {
    return this._buffer.slice(this._offset, this._offset + length);
    this._offset += length;
  }

  skipBytes(length: number) {
    this._offset += length;
  }

  readStringUtf8(length: number | null) {
    if (length == null) length = this._buffer.length - this._offset;

    length = Math.max(0, length);

    let value = this._buffer.toString("utf8", this._offset, this._offset + length);
    this._offset += length;

    return value;
  }

  readStringUnicode(length: number | null) {
    if (length == null) length = this._buffer.length - this._offset;

    length = Math.max(0, length);

    let safeLength = length - (length % 2);
    safeLength = Math.max(0, safeLength);

    let value = this._buffer.toString("ucs2", this._offset, this._offset + safeLength);
    this._offset += length;

    return value;
  }

  readStringZeroUtf8() {
    let length = 0;
    let terminatorLength = 0;

    for (let i = this._offset; i < this._buffer.length; i++) {
      if (this._buffer.readUInt8(i) == 0) {
        terminatorLength = 1;
        break;
      }
      length++;
    }

    let value = this.readStringUtf8(length);
    this._offset += terminatorLength;

    return value;
  }

  readStringZeroUnicode() {
    let length = 0;

    let terminatorLength = ((this._buffer.length - this._offset) & 1) != 0 ? 1 : 0;
    for (let i = this._offset; i + 1 < this._buffer.length; i += 2) {
      if (this._buffer.readUInt16LE(i) == 0) {
        terminatorLength = 2;
        break;
      }
      length += 2;
    }

    let value = this.readStringUnicode(length);
    this._offset += terminatorLength;

    return value;
  }
}
