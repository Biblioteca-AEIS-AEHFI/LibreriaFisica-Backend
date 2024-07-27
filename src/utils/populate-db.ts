import { userTypes, type NewUserType } from "../db/schema/userTypes";
import { reputations, type NewReputation } from "../db/schema/reputations";
import { connection, db } from "../db/db";

// Populate static tables on database

// UserTypes: admin, normal
const newTypes: NewUserType[] = [{ name: "admin" }, { name: "normal" }];

// Reputations: mala, buena, muy buena, excelente
const newReputations: NewReputation[] = [
  { name: "mala" },
  { name: "buena" },
  { name: "muy buena" },
  { name: "excelente" },
];

try {
  await db.insert(userTypes).values(newTypes);
  await db.insert(reputations).values(newReputations);
} catch (e) {
  console.log(e);
}

await connection.end();
console.log("Finished insertions successfully!");
