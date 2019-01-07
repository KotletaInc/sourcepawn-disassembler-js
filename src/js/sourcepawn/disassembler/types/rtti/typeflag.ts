export enum TypeFlag {
    Bool = 0x01,
    Int32 = 0x06,
    Float32 = 0x0c,
    Char8 = 0x0e,
    Any = 0x10,
    TopFunction = 0x11,

    FixedArray = 0x30,
    Array = 0x31,
    Function = 0x32,

    Enum = 0x42,
    Typedef = 0x43,
    Typeset = 0x44,
    Struct = 0x45,
    EnumStruct = 0x46,

    Void = 0x70,
    Variadic = 0x71,
    ByRef = 0x72,
    Const = 0x73,
}
