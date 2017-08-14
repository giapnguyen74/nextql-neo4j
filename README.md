# nextql-neo4j
NextQL plugin for neo4j - Experienced project
> Only work with nextql >= 0.0.6 which support getAttr hook

# Samples
```js
const NextQL = require("../../nextql");
const nextql = new NextQL();

const nextqlNeo4j = require("../src");

var neo4j = require("neo4j-driver").v1;

var driver = neo4j.driver(
	"bolt://localhost",
	neo4j.auth.basic("neo4j", "neo4j")
);
nextql.use(nextqlNeo4j, { driver });

nextql.model("Person", {
	neo4j: {
		relationships: {
			movies: {
				type: "ACTOR",
				in: true
			}
		}
	},
	fields: {
		name: 1,
		fullName: 1
	}
});

nextql.model("Movie", {
	neo4j: {
		relationships: {
			actors: {
				type: "ACTOR"
			}
		}
	},
	fields: {
		name: 1
	},
	methods: {
		updateActors(params, ctx) {
			return ctx.neo4j
				.run(
					`MATCH (m:Movie),(p:Person)
WHERE m.name = $movie AND p.name IN $actors
CREATE (m)-[n:ACTOR]->(p)
RETURN n`,
					{
						movie: params.movie,
						actors: params.actors
					}
				)
				.then(result => result.length);
		}
	}
});

const context = nextqlNeo4j.create_context(driver);

await nextql.execute(
		{
			Person: {
				"create/1": {
					$params: {
						data: {
							name: "Jackson"
						}
					}
				},
				"create/2": {
					$params: {
						data: {
							name: "Timcook"
						}
					}
				}
			},
			Movie: {
				"create/1": {
					$params: {
						data: {
							name: "GoT"
						}
					}
				},
				"create/2": {
					$params: {
						data: {
							name: "WoW"
						}
					}
				}
			}
		},
		context
	);

	await nextql.execute(
		{
			Movie: {
				updateActors: {
					$params: {
						movie: "GoT",
						actors: ["Jackson", "Timcook"]
					}
				},
				"updateActors/1": {
					$params: {
						movie: "WoW",
						actors: ["Jackson"]
					}
				}
			}
		},
		context
	);

	const result = await nextql.execute(
		{
			Movie: {
				find: {
					$params: {
						query: {
							name: "GoT"
						}
					},
					name: 1,
					actors: {
						name: 1,
						movies: {
							name: 1
						}
					}
				}
			}
		},
		context
	);
```

Result
```js
{
	Movie: {
		find: [
			{
				name: "GoT",
				actors: [
					{
						name: "Jackson",
						movies: [
							{
								name: "WoW"
							},
							{
								name: "GoT"
							}
						]
					},
					{
						name: "Timcook",
						movies: [
							{
								name: "GoT"
							}
						]
					}
				]
			}
		]
	}
}
```
