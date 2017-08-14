/**
 * {
 *   neo4j: {
 *     labels: [secondary],
 *     key: "name",
 *     relationships: {
 *     	 actors: { type: "ACT_IN", in: false, single: false }
 *     }
 *   }
 * }
 */

const where = require("./where");

function run_command(session, command, params, node = "n", single) {
	return session.run(command, params).then(result => {
		if (result.records.length == 0) return undefined;

		if (single) {
			return result.records[0].get(node);
		} else {
			return result.records.map(r => r.get(node));
		}
	});
}

function computed_neo4j_relationships(key, node_labels, rel) {
	return (source, params, context, info) => {
		const session = context.neo4j.session;
		const p = {};
		p[key] = source.properties[key];

		if (rel.in) {
			return run_command(
				session,
				`MATCH (${node_labels} {${key}:$${key}})<-[r:${rel.type}]-(n) RETURN n`,
				p,
				rel.single
			);
		} else {
			return run_command(
				session,
				`MATCH (${node_labels} {${key}:$${key}})-[r:${rel.type}]->(n) RETURN n`,
				p,
				rel.single
			);
		}
	};
}

function inject_neo4j_relationships(options) {
	const name = options.name;
	const key = options.neo4j.key || "name";
	const node_labels = ["x", name]
		.concat(options.neo4j.labels || [])
		.join(":");

	const relationships = {};
	const rels = options.neo4j.relationships || {};
	Object.keys(rels).forEach(
		k =>
			(relationships[k] = computed_neo4j_relationships(
				key,
				node_labels,
				rels[k]
			))
	);

	options.computed = Object.assign({}, options.computed, relationships);
}

function inject_neo4j_crud_methods(options) {
	const name = options.name;
	const key = options.neo4j.key || "name";

	const node_labels = ["n", name]
		.concat(options.neo4j.labels || [])
		.join(":");

	options.methods = Object.assign(
		{
			create(params, context) {
				const session = context.neo4j.session;
				return run_command(
					session,
					`CREATE (${node_labels} $data) RETURN n`,
					{
						data: params.data
					}
				);
			},
			remove(params, context) {
				const session = context.neo4j.session;
				const p = {};
				p[key] = params.id;
				return run_command(
					session,
					`MATCH (${node_labels} {${key}:$${key}}) DETACH DELETE n RETURN n`,
					p
				).then(result => (result && result.length) || 0);
			},
			update(params, context) {
				const session = context.neo4j.session;
				const p = {};
				p[key] = params.id;
				p["data"] = params.data;
				return run_command(
					session,
					`MATCH (${node_labels} {${key}:$${key}}) SET n+=$data RETURN n`,
					p
				);
			},
			find(params, context) {
				const session = context.neo4j.session;
				const result = params.query ? where(params.query) : {};
				if (result.query) {
					return run_command(
						session,
						`MATCH (${node_labels}) WHERE ${result.query} RETURN n`,
						result.params
					);
				} else {
					return run_command(
						session,
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
	install(nextql) {
		nextql.model("Relationship", {
			fields: {
				start: "*",
				end: "*",
				type: "*",
				properties: "*"
			}
		});

		nextql.afterResolveType(source => {
			if (source.constructor.name == "Node") {
				return source.labels && source.labels[0];
			}
		});

		nextql.beforeCreate(options => {
			if (options.neo4j) {
				inject_neo4j_crud_methods(options);
				inject_neo4j_relationships(options);
			}
		});
	},
	create_context(driver) {
		return {
			neo4j: {
				session: driver.session(),
				run(command, params, single) {
					return run_command(this.session, command, params, single);
				}
			}
		};
	}
};
