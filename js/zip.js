/* ==========================================================================
   零依赖 ZIP 打包（只用 store 模式，不压缩）
   生成的 zip Windows 资源管理器能直接解压。
   ========================================================================== */
(function () {
  'use strict';

  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = (CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(text) {
    return new TextEncoder().encode(text);
  }

  function dosDateTime(date) {
    var d = date || new Date();
    var time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds() / 2) & 0x1F);
    var day = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
    return { time: time, date: day };
  }

  function u16(value) {
    return [value & 0xFF, (value >>> 8) & 0xFF];
  }

  function u32(value) {
    return [value & 0xFF, (value >>> 8) & 0xFF, (value >>> 16) & 0xFF, (value >>> 24) & 0xFF];
  }

  /**
   * files: [{ path: 'src/app.js', data: Uint8Array }]
   * 返回 Blob
   */
  function build(files, options) {
    var opts = options || {};
    var stamp = dosDateTime(new Date());
    var chunks = [];
    var central = [];
    var offset = 0;
    var encoder = new TextEncoder();

    (files || []).forEach(function (file) {
      var nameBytes = encoder.encode(String(file.path).replace(/\\/g, '/'));
      var data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data || []);
      var crc = crc32(data);

      var local = []
        .concat(u32(0x04034b50))
        .concat(u16(20))
        .concat(u16(0x0800))           // UTF-8 文件名
        .concat(u16(0))                // store
        .concat(u16(stamp.time))
        .concat(u16(stamp.date))
        .concat(u32(crc))
        .concat(u32(data.length))
        .concat(u32(data.length))
        .concat(u16(nameBytes.length))
        .concat(u16(0));

      chunks.push(new Uint8Array(local), nameBytes, data);

      central.push({
        nameBytes: nameBytes,
        crc: crc,
        size: data.length,
        offset: offset
      });

      offset += local.length + nameBytes.length + data.length;
    });

    var centralParts = [];
    var centralSize = 0;
    central.forEach(function (item) {
      var header = []
        .concat(u32(0x02014b50))
        .concat(u16(20))
        .concat(u16(20))
        .concat(u16(0x0800))
        .concat(u16(0))
        .concat(u16(stamp.time))
        .concat(u16(stamp.date))
        .concat(u32(item.crc))
        .concat(u32(item.size))
        .concat(u32(item.size))
        .concat(u16(item.nameBytes.length))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u32(0))
        .concat(u32(item.offset));
      centralParts.push(new Uint8Array(header), item.nameBytes);
      centralSize += header.length + item.nameBytes.length;
    });

    var end = []
      .concat(u32(0x06054b50))
      .concat(u16(0))
      .concat(u16(0))
      .concat(u16(central.length))
      .concat(u16(central.length))
      .concat(u32(centralSize))
      .concat(u32(offset))
      .concat(u16(0));

    var parts = chunks.concat(centralParts, [new Uint8Array(end)]);
    return new Blob(parts, { type: opts.type || 'application/zip' });
  }

  function textData(text) {
    return utf8(String(text == null ? '' : text));
  }

  window.KairiZip = {
    build: build,
    textData: textData,
    crc32: crc32
  };
})();
