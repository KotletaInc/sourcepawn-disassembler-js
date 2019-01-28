import { SourcePawnFile } from '../../sourcepawnfile';
import { TypeFlag } from './typeflag';

export class TypeBuilder {
  public offset: number;
  private smxFile: SourcePawnFile;
  private bytes: Uint8Array;
  private isConst: boolean;

  public constructor(smxFile: SourcePawnFile, bytes: Uint8Array, offset: number) {
    this.smxFile = smxFile;
    this.bytes = bytes;
    this.offset = offset;
    this.isConst = false;
  }

  // Decode a type, but reset the |is_const| indicator for non-
  // dependent type.
  public decodeNew(): string {
    const wasConst = this.isConst;
    this.isConst = false;

    let result = this.decode();
    if (this.isConst) {
      result = 'const ' + result;
    }

    this.isConst = wasConst;
    return result;
  }

  public decodeFunction(): string {
    const argc = this.bytes[this.offset++];

    let variadic = false;
    if (this.bytes[this.offset] === TypeFlag.Variadic) {
      variadic = true;
      this.offset++;
    }

    let returnType = '';
    if (this.bytes[this.offset] === TypeFlag.Void) {
      returnType = 'void';
      this.offset++;
    } else {
      returnType = this.decodeNew();
    }

    const argv = [];
    for (let i = 0; i < argc; i++) {
      const isByRef = this.match(TypeFlag.ByRef);
      let text = this.decodeNew();
      if (isByRef) {
        text += '&';
      }
      argv[i] = text;
    }

    let signature = 'function ' + returnType + ' (' + argv.join(', ');
    if (variadic) {
      signature += '...';
    }
    signature += ')';
    return signature;
  }

  public decodeTypeset(): string[] {
    const count = this.decodeUint32();
    const types = [];

    for (let i = 0; i < count; i++) {
      types[i] = this.decodeNew();
    }
    return types;
  }

  private decode(): string {
    this.isConst = this.match(TypeFlag.Const) || this.isConst;

    const b = this.bytes[this.offset++];
    switch (b) {
      case TypeFlag.Bool:
        return 'bool';
      case TypeFlag.Int32:
        return 'int';
      case TypeFlag.Float32:
        return 'float';
      case TypeFlag.Char8:
        return 'char';
      case TypeFlag.Any:
        return 'any';
      case TypeFlag.TopFunction:
        return 'Function';
      case TypeFlag.FixedArray: {
        const size = this.decodeUint32();
        const inner = this.decode();
        return inner + '[' + size + ']';
      }
      case TypeFlag.Array: {
        const inner = this.decode();
        return inner + '[]';
      }
      case TypeFlag.Enum: {
        const index = this.decodeUint32();
        return this.smxFile.rttiEnums.enums[index].name;
      }
      case TypeFlag.Typedef: {
        const index = this.decodeUint32();
        return this.smxFile.rttiTypedefs.typedefs[index].name;
      }
      case TypeFlag.Typeset: {
        const index = this.decodeUint32();
        return this.smxFile.rttiTypesets.typesets[index].name;
      }
      case TypeFlag.Classdef: {
        const index = this.decodeUint32();
        return this.smxFile.rttiClassDefs.classdefs[index].name;
      }
      case TypeFlag.Function:
        return this.decodeFunction();
      case TypeFlag.EnumStruct: {
        const index = this.decodeUint32();
        return this.smxFile.rttiEnumStructs.entries[index].name;
      }
    }
    throw new Error('unknown type code: ' + b);
  }

  private match(b: number): boolean {
    if (this.bytes[this.offset] !== b) {
      return false;
    }
    this.offset++;
    return true;
  }

  private decodeUint32(): number {
    let value = 0;
    let shift = 0;
    while (true) {
      const b = this.bytes[this.offset++];
      value |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) {
        break;
      }
      shift += 7;
    }
    return value;
  }
}
