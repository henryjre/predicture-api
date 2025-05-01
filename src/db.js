import pkg from "pg";
import fs from "fs";

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: {
    ca: process.env.DBCERT,
    rejectUnauthorized: true,
  },
});

export default pool;
