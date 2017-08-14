const NextQL = require("../../../nextql");
const nextql = new NextQL();

const nextqlNeo4j = require("../../src");

var neo4j = require("neo4j-driver").v1;

var driver = neo4j.driver(
	"bolt://localhost",
	neo4j.auth.basic("neo4j", "neo4j")
);
nextql.use(nextqlNeo4j);
const context = nextqlNeo4j.create_context(driver);

const models = require("./models");
Object.keys(models).forEach(k => nextql.model(k, models[k]));
async function run() {
	const d = await nextql.execute(
		{
			Department: {
				find: {
					name: 1,
					subjects: {
						name: 1,
						teachers: {
							name: 1
						}
					}
				}
			}
		},
		context
	);
	console.log(JSON.stringify(d.Department.find, null, 2));

	const s = await nextql.execute(
		{
			School: {
				find: {
					name: 1,
					teachers: {
						name: 1
					},
					departments: {
						name: 1
					},
					headTeacher: {
						name: 1
					},
					students: {
						name: 1
					}
				}
			}
		},
		context
	);
	console.log(JSON.stringify(s.School.find, null, 2));
}

run().then(() => true, console.log).then(() => driver.close());
