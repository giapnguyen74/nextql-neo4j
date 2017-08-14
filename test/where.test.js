const where = require("../src/where");

test("simple clause", function() {
	const r = where({
		a: "test"
	});
	expect(r).toMatchObject({ query: "n.a = $a", params: { a: "test" } });
});

test("simple $and clause", function() {
	const r = where({
		a: "test",
		b: 1
	});
	expect(r).toMatchObject({
		query: "( n.a = $i0_a AND n.b = $i1_b )",
		params: { i0_a: "test", i1_b: 1 }
	});
});

test("simple $or clause", function() {
	const r = where({
		$or: [{ a: "test" }, { b: 1 }]
	});
	expect(r).toMatchObject({
		query: "( n.a = $i0_a OR n.b = $i1_b )",
		params: { i0_a: "test", i1_b: 1 }
	});
});

test("combine $and $or clause", function() {
	const r = where({
		$or: [{ a: "test" }, { b: 1 }],
		c: "test"
	});
	expect(r).toMatchObject({
		query: "( ( n.a = $i0_i0_a OR n.b = $i0_i1_b ) AND n.c = $i1_c )",
		params: {
			i0_i0_a: "test",
			i0_i1_b: 1,
			i1_c: "test"
		}
	});
});

test("$in clause", function() {
	const r = where({
		c: { $in: [1, 2, 3] }
	});
	expect(r).toMatchObject({
		query: "n.c IN $c",
		params: {
			c: [1, 2, 3]
		}
	});
});

test("$gt clause", function() {
	const r = where({
		c: { $gt: 10 }
	});
	expect(r).toMatchObject({
		query: "n.c > $c",
		params: {
			c: 10
		}
	});
});

test("$gte clause", function() {
	const r = where({
		c: { $gte: 10 }
	});
	expect(r).toMatchObject({
		query: "n.c >= $c",
		params: {
			c: 10
		}
	});
});

test("$lte and lt clause", function() {
	const r = where({
		c: { $gte: 10, $lt: 20 }
	});
	expect(r).toMatchObject({
		query: "( n.c >= $c_i0_c AND n.c < $c_i1_c )",
		params: {
			c_i0_c: 10,
			c_i1_c: 20
		}
	});
});

test("$regex clause", function() {
	const r = where({
		c: { $regex: "dd", $lt: 20 }
	});
	expect(r).toMatchObject({
		query: "( n.c =~ $c_i0_c AND n.c < $c_i1_c )",
		params: {
			c_i0_c: "dd",
			c_i1_c: 20
		}
	});
});

test("$exists clause", function() {
	const r = where({
		c: { $exists: true },
		d: { $exists: false }
	});
	expect(r).toMatchObject({
		query: "( n.c IS NOT NULL AND n.d IS NULL )",
		params: {}
	});
});

test("$eq clause", function() {
	const r = where({
		c: { $exists: 1 },
		d: { $eq: "1u" }
	});
	expect(r).toMatchObject({
		query: "( n.c IS NOT NULL AND n.d = $i1_d )",
		params: {
			i1_d: "1u"
		}
	});
});

test("invalid op clause", function() {
	expect(() =>
		where({
			c: { $dd: 1 },
			d: { $eq: "1u" }
		})
	).toThrow("Invalid query");
});

test("invalid null clause", function() {
	expect(() =>
		where({
			c: {},
			d: { $eq: "1u" }
		})
	).toThrow("Invalid clause");
});

test("invalid $or clause", function() {
	expect(() =>
		where({
			$or: { c: 1 },
			d: { $eq: "1u" }
		})
	).toThrow("$or required array of clause");
});

test("invalid $and clause", function() {
	expect(() =>
		where({
			$and: { c: 1 },
			d: { $eq: "1u" }
		})
	).toThrow("$and required array of clause");
});

test("invalid field", function() {
	expect(() =>
		where({
			"'c": 3,
			d: { $eq: "1u" }
		})
	).toThrow("Not valid name");

	expect(() =>
		where({
			"c'": 10,
			d: { $eq: "1u" }
		})
	).toThrow("Not valid name");
});

test("valid underscore field", function() {
	const result = where({
		A_a_1: 3
	});

	expect(result).toMatchObject({
		query: "n.A_a_1 = $A_a_1",
		params: { A_a_1: 3 }
	});
});

test("null sub-clause", function() {
	expect(() =>
		where({
			$or: [{}]
		})
	).toThrow("Invalid clause");
});

test("null clause", function() {
	expect(where({})).toMatchObject({ query: null, params: {} });
});
