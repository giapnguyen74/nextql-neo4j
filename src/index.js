/**
 * {
 *   neo4j: {
 *     labels: [secondary],
 *     key: "name",
 *     relationships: {
 *     	 actors: { type: "ACT_IN", in: false, edge: false }
 *     }
 *   }
 * }
 */

const where = require("./where");

function run_command(driver, command, params) {
	const session = driver.session();
	return session.run(command, params).then(
		result => {
			session.close();
			return result.records.map(r => r.get("n"));
		},
		err => {
			session.close();
			return Promise.reject(err);
		}
	);
}

function inject_neo4j_crud_methods(driver, options) {
	const name = options.name;
	const key = options.neo4j.key || "name";

	const node_labels = ["n", name]
		.concat(options.neo4j.labels || [])
		.join(":");

	options.methods = Object.assign(
		{
			create(params, context) {
				return run_command(
					driver,
					`CREATE (${node_labels} $data) RETURN n`,
					{
						data: params.data
					}
				);
			},
			remove(params, context) {
				const p = {};
				p[key] = params.id;
				return run_command(
					driver,
					`MATCH (${node_labels} {${key}:$${key}}) DETACH DELETE n RETURN n`,
					p
				).then(result => (result && result.length) || 0);
			},
			update(params, context) {
				const p = {};
				p[key] = params.id;
				p["data"] = params.data;
				return run_command(
					driver,
					`MATCH (${node_labels} {${key}:$${key}}) SET n+=$data RETURN n`,
					p
				);
			},
			find(params, context) {
				const result = params.query ? where(params.query) : {};
				if (result.query) {
					return run_command(
						driver,
						`MATCH (${node_labels}) WHERE ${result.query} RETURN n`,
						result.params
					);
				} else {
					return run_command(
						driver,
						`MATCH (${node_labels}) RETURN n`
					);
				}
			}
		},
		options.methods
	);

	options.getAttr = function(value, fieldName) {
		return value.properties[fieldName];
	};
}

module.exports = {
	install(nextql, { driver }) {
		nextql.afterResolveType(source => {
			if (source.constructor.name == "Node") {
				return source.labels && source.labels[0];
			}
		});

		nextql.beforeCreate(options => {
			if (options.neo4j) {
				inject_neo4j_crud_methods(driver, options);
			}
		});
	}
};
