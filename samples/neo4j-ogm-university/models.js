const Class = {
	neo4j: {
		relationships: {
			subject: {
				type: "SUBJECT_TAUGHT",
				single: true
			},
			teacher: {
				type: "TEACHES_CLASS",
				in: true,
				single: true
			},
			enrollments: {
				type: "ENROLLED",
				in: true
			}
		}
	},
	fields: {
		name: 1
	}
};

const Department = {
	neo4j: {
		relationships: {
			teachers: {
				type: "DEPARTMENT_MEMBER"
			},
			subjects: {
				type: "CURRICULUM"
			}
		}
	},
	fields: {
		name: 1
	}
};

const School = {
	neo4j: {
		relationships: {
			departments: {
				type: "DEPARTMENT"
			},
			teachers: {
				type: "STAFF"
			},
			headTeacher: {
				type: "HEAD_TEACHER",
				single: true
			},
			students: {
				type: "STUDENT"
			}
		}
	},
	fields: {
		name: 1
	}
};

const Student = {
	neo4j: {
		relationships: {
			enrollments: { type: "ENROLLED" },
			studyBuddies: { type: "BUDDY", in: true }
		}
	},
	fields: {
		name: 1
	}
};

const StudyBuddy = {
	neo4j: {
		relationships: {
			buddies: { type: "BUDDY" }
		}
	}
};

const Subject = {
	neo4j: {
		relationships: {
			department: { type: "CURRICULUM", in: true, single: true },
			teachers: { type: "TAUGHT_BY" },
			courses: { type: "SUBJECT_TAUGHT", in: true }
		}
	},
	fields: {
		name: 1
	}
};

const Teacher = {
	neo4j: {
		relationships: {
			courses: { type: "TEACHES_CLASS" },
			department: { type: "DEPARTMENT_MEMBER", in: true },
			subjects: { type: "TAUGHT_BY", in: true }
		}
	},
	fields: {
		name: 1
	}
};

module.exports = {
	Teacher,
	Subject,
	Student,
	School,
	Department,
	Class
};
