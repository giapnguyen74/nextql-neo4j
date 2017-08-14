function isValidName(str) {
	var code, i, len;
	code = str.charCodeAt(0);
	if (
		!(code > 64 && code < 91) && // upper alpha (A-Z)
		!(code > 96 && code < 123)
	) {
		throw new Error("Not valid name");
	}

	for (i = 1, len = str.length; i < len; i++) {
		code = str.charCodeAt(i);

		if (
			!(code > 47 && code < 58) && // numeric (0-9)
			!(code > 64 && code < 91) && // upper alpha (A-Z)
			!(code > 96 && code < 123) && // lower alpha (a-z)
			!(code == 95)
		) {
			throw new Error("Not valid name");
		}
	}
	return true;
}

function info_append_path(info, path) {
	return Object.assign({}, info, {
		path: info.path.concat(path)
	});
}

const ops = {
	$regex: "=~",
	$exists: "IS",
	$in: "IN",
	$gt: ">",
	$gte: ">=",
	$lt: "<",
	$lte: "<=",
	$eq: "="
};

function $or(arrClause, info) {
	if (!Array.isArray(arrClause)) {
		throw new Error("$or required array of clause");
	}
	const arrResult = arrClause.map((c, idx) =>
		complexClause(c, info_append_path(info, "i" + idx))
	);

	return ["(", arrResult.join(" OR "), ")"].join(" ");
}

function $and(arrClause, info) {
	if (!Array.isArray(arrClause)) {
		throw new Error("$and required array of clause");
	}
	const arrResult = arrClause.map((c, idx) =>
		complexClause(c, info_append_path(info, "i" + idx))
	);
	return ["(", arrResult.join(" AND "), ")"].join(" ");
}

function simpleClause(key, value, info) {
	let op;
	if (value && value.constructor == Object) {
		const keys = Object.keys(value);

		if (keys.length == 0) {
			throw new Error("Invalid clause");
		}

		if (keys.length > 1) {
			const arrClause = keys.map(k => {
				const clause = {};
				clause[key] = {};
				clause[key][k] = value[k];
				return clause;
			});
			return $and(arrClause, info);
		}

		if (!ops[keys[0]]) {
			throw new Error("Invalid query");
		}

		op = ops[keys[0]];
		value = value[keys[0]];
		if (op == "IS") {
			isValidName(key);
			if (value) {
				return `n.${key} IS NOT NULL`;
			} else {
				return `n.${key} IS NULL`;
			}
		}
	} else {
		op = ops["$eq"];
	}

	isValidName(key);
	const path = info.path.join("_");
	info.params[path] = value;

	return `n.${key} ${op} $${path}`;
}

function complexClause(c, info) {
	const keys = Object.keys(c);

	if (keys.length == 0) {
		throw new Error("Invalid clause");
	}
	if (keys.length > 1) {
		const arrClause = keys.map(k => {
			const clause = {};
			clause[k] = c[k];
			return clause;
		});
		return $and(arrClause, info);
	}
	const key = keys[0];

	if (key == "$or") {
		return $or(c["$or"], info);
	}

	if (key == "$and") {
		return $and(c["$and"], info);
	}

	return simpleClause(key, c[key], info_append_path(info, key));
}

function where(clause) {
	if (Object.keys(clause).length == 0) {
		return {
			query: null,
			params: {}
		};
	}
	const info = {
		path: [],
		params: {}
	};
	const query = complexClause(clause, info);
	return {
		query: query,
		params: info.params
	};
}

module.exports = where;
