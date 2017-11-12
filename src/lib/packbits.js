/**
 * Max length of PackBits literal.
 * @type {Number}
 */
const MAX_LITERAL_LENGTH = 127

/**
 * It pack (compress)/unpack (decompress) based on PackBits.
 * This class port Geeks with Blogs's code (Apache License v2.0) to Node.
 *
 * @see https://en.wikipedia.org/wiki/PackBits
 * @see http://geekswithblogs.net/rakker/archive/2015/12/14/packbits-in-c.aspx
 */
export default class PackBits {
  /**
   * Compress PackBits binary.
   *
   * @param {Array.<Number>} src Source binary.
   *
   * @return {Array.<Number>} PackBits Compressed binary.
   *
   */
  static pack (src) {
    if (!(src && src.length && 0 < src.length)) {
      return []
    }

    let dest     = []
    let literals = []

    for (let i = 0, max = src.length; i < max; ++i) {
      const current = PackBits._toUInt8(src[i])
      if (i + 1 < max) {
        const next = PackBits._toUInt8(src[i + 1])
        if (current === next) {
          dest = dest.concat(PackBits._literalToResult(literals))
          literals = []

          const maxJ   = (max <= i + MAX_LITERAL_LENGTH ? max - i - 1 : MAX_LITERAL_LENGTH)
          let   hitMax = true
          let   runLength = 1

          for (let j = 2; j <= maxJ; ++j) {
            const run = src[i + j]
            if (current !== run) {
              hitMax = false
              const count = PackBits._toUInt8(0 - runLength)
              i += j - 1
              dest.push(count)
              dest.push(current)
              break
            }

            ++runLength
          }

          if (hitMax) {
            dest.push(PackBits._toUInt8(0 - maxJ))
            dest.push(current)
            i += maxJ
          }
        } else {
          literals.push(current)
          if (literals.length === MAX_LITERAL_LENGTH) {
            dest = dest.concat(PackBits._literalToResult(literals))
            literals = []
          }
        }
      } else {
        literals.push(current)
        dest = dest.concat(PackBits._literalToResult(literals))
        literals = []
      }
    }

    return dest
  }

  /**
   * Decompress PackBits compressed binary.
   *
   * @param {Array.<Number>} src Source binary.
   *
   * @return {Array.<Number>} Decompressed binary.
   */
  static unpack (src) {
    const dest = []
    for (let i = 0, max = src.length; i < max; ++i) {
      const count = PackBits._toInt8(PackBits._toUInt8(src[i]))
      if (count === -128) {
        // Do nothing, skip it
      } else if (0 <= count) {
        const total = count + 1
        for (let j = 0; j < total; ++j) {
          dest.push(PackBits._toUInt8(src[i + j + 1]))
        }

        i += total
      } else {
        const total = Math.abs(count) + 1
        for (let j = 0; j < total; ++j) {
          dest.push(PackBits._toUInt8(src[i + 1]))
        }

        ++i
      }
    }

    return dest
  }

  /**
   * Convert PackBits literals to resuls.
   *
   * @param {Array.<Number>} literals PackBits literals.
   *
   * @return {Array.<Number>} Converted literals.
   */
  static _literalToResult (literals) {
    return literals.length === 0 ? [] : [PackBits._toUInt8(literals.length - 1)].concat(literals)
  }

  /**
   * Convert a 8bit signed value to unsigned value.
   *
   * @param {Number} value 8bit signed value (-127 to 127)
   *
   * @return {Number} Unsigned value (0 to 255).
   */
  static _toUInt8 (value) {
    return value & 0xFF
  }

  /**
   * Convert a 8bit unsigned value to signed value.
   *
   * @param {Number} value 8bit unsigned value (0 to 255).
   *
   * @return {Number} Signed value (-127 to 127).
   *
   * @see https://github.com/inexorabletash/polyfill/blob/master/typedarray.js
   */
  static _toInt8 (value) {
    return (value << 24) >> 24
  }
}