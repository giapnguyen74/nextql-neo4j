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
	neo4j: {},
	fields: {
		name: 1,
		fullName: 1
	}
});

test("create", async function() {
	const session = driver.session();
	await session.run("MATCH (n:Person) DETACH DELETE n");
	session.close();

	const result = await nextql.execute({
		Person: {
			create: {
				$params: { data: { name: "Giap" } },
				name: 1
			}
		}
	});
	expect(result).toMatchObject({
		Person: {
			create: [
				{
					name: "Giap"
				}
			]
		}
	});
});

test("findAll", async function() {
	const result = await nextql.execute({
		Person: {
			find: {
				name: 1
			}
		}
	});
	expect(result).toMatchObject({
		Person: {
			find: [
				{
					name: "Giap"
				}
			]
		}
	});
});

test("find with query", async function() {
	const result = await nextql.execute({
		Person: {
			find: {
				$params: {
					query: {
						name: {
							$gt: "G"
						}
					}
				},
				name: 1
			}
		}
	});
	expect(result).toMatchObject({
		Person: {
			find: [
				{
					name: "Giap"
				}
			]
		}
	});
});

test("update", async function() {
	const result = await nextql.execute({
		Person: {
			update: {
				$params: {
					id: "Giap",
					data: {
						fullName: "Thanh"
					}
				},
				name: 1,
				fullName: 1
			}
		}
	});

	expect(result).toMatchObject({
		Person: {
			update: [
				{
					fullName: "Thanh",
					name: "Giap"
				}
			]
		}
	});
});

test("remove", async function() {
	const result = await nextql.execute({
		Person: {
			remove: {
				$params: {
					id: "Giap"
				}
			}
		}
	});
	expect(result).toMatchObject({
		Person: {
			remove: 1
		}
	});
});

afterAll(() => driver.close());
