require(__dirname + "/test-helper");
var Writer = require(__dirname + "/../../lib/writer");

test('adding int32', function() {
  var testAddingInt32 = function(int, expectedBuffer) {
    test('writes ' + int, function() {
      var subject = new Writer();
      var result = subject.addInt32(int).join();
      assert.equalBuffers(result, expectedBuffer);
    })
  }

  testAddingInt32(0, [0, 0, 0, 0]);
  testAddingInt32(1, [0, 0, 0, 1]);
  testAddingInt32(256, [0, 0, 1, 0]);
  test('writes largest int32', function() {
    //todo need to find largest int32 when I have internet access
    return false;
  })

  test('writing multiple int32s', function() {
    var subject = new Writer();
    var result = subject.addInt32(1).addInt32(10).addInt32(0).join();
    assert.equalBuffers(result, [0, 0, 0, 1, 0, 0, 0, 0x0a, 0, 0, 0, 0]);
  })

  test('having to resize the buffer', function() {
    test('after resize correct result returned', function() {
      var subject = new Writer(10);
      subject.addInt32(1).addInt32(1).addInt32(1)
      assert.equalBuffers(subject.join(), [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
    })
  })
})

test('int16', function() {
  test('writes 0', function() {
    var subject = new Writer();
    var result = subject.addInt16(0).join();
    assert.equalBuffers(result, [0,0]);
  })

  test('writes 400', function() {
    var subject = new Writer();
    var result = subject.addInt16(400).join();
    assert.equalBuffers(result, [1, 0x90])
  })

  test('writes many', function() {
    var subject = new Writer();
    var result = subject.addInt16(0).addInt16(1).addInt16(2).join();
    assert.equalBuffers(result, [0, 0, 0, 1, 0, 2])
  })

  test('resizes if internal buffer fills up', function() {
    var subject = new Writer(3);
    var result = subject.addInt16(2).addInt16(3).join();
    assert.equalBuffers(result, [0, 2, 0, 3])
  })

})

test('cString', function() {
  test('writes empty cstring', function() {
    var subject = new Writer();
    var result = subject.addCString().join();
    assert.equalBuffers(result, [0])
  })

  test('writes non-empty cstring', function() {
    var subject = new Writer();
    var result = subject.addCString("!!!").join();
    assert.equalBuffers(result, [33, 33, 33, 0]);
  })

  test('resizes if reached end', function() {
    var subject = new Writer(3);
    var result = subject.addCString("!!!").join();
    assert.equalBuffers(result, [33, 33, 33, 0]);
  })

  test('writes multiple cstrings', function() {
    var subject = new Writer();
    var result = subject.addCString("!").addCString("!").join();
    assert.equalBuffers(result, [33, 0, 33, 0]);
  })

})

test('writes char', function() {
  var subject = new Writer(2);
  var result = subject.addChar('a').addChar('b').addChar('c').join();
  assert.equalBuffers(result, [0x61, 0x62, 0x63])
})

test('gets correct byte length', function() {
  var subject = new Writer(5);
  assert.equal(subject.getByteLength(), 0)
  subject.addInt32(0)
  assert.equal(subject.getByteLength(), 4)
  subject.addCString("!")
  assert.equal(subject.getByteLength(), 6)
})

test('can add arbitrary buffer to the end', function() {
  var subject = new Writer(4);
  subject.addCString("!!!")
  var result = subject.add(Buffer("@@@")).join();
  assert.equalBuffers(result, [33, 33, 33, 0, 0x40, 0x40, 0x40]);
})

test('can write normal string', function() {
  var subject = new Writer(4);
  var result = subject.addString("!").join();
  assert.equalBuffers(result, [33]);
  test('can write cString too', function() {
    var result = subject.addCString("!").join();
    assert.equalBuffers(result, [33, 33, 0]);
    test('can resize', function() {
      var result = subject.addString("!!").join();
      assert.equalBuffers(result, [33, 33, 0, 33, 33]);
    })

  })

})


test('clearing', function() {
  var subject = new Writer();
  subject.addCString("@!!#!#");
  subject.addInt32(10401);
  subject.clear();
  assert.equalBuffers(subject.join(), []);
  test('can keep writing', function() {
    var joinedResult = subject.addCString("!").addInt32(9).addInt16(2).join();
    assert.equalBuffers(joinedResult, [33, 0, 0, 0, 0, 9, 0, 2]);
    test('flush', function() {
      var flushedResult = subject.flush();
      test('returns result', function() {
        assert.equalBuffers(flushedResult, [33, 0, 0, 0, 0, 9, 0, 2])
      })
      test('clears the writer', function() {
        assert.equalBuffers(subject.join(), [])
        assert.equalBuffers(subject.flush(), [])
      })
    })
  })

})

test("resizing to much larger", function() {
  var subject = new Writer(2);
  var string = "!!!!!!!!";
  var result = subject.addCString(string).flush();
  assert.equalBuffers(result, [33, 33, 33, 33, 33, 33, 33, 33, 0])
})
