const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const jwt = require("jsonwebtoken");
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.prototype.generateToken = async function () {
  try {
    const token = await jwt.sign({ id: this.id }, process.env.JWT);
    return { token };
  } catch (error) {
    console.error(error);
  }
};

User.byToken = async (token) => {
  try {
    const payload = await jwt.verify({ token }, process.env.JWT);
    if (payload) {
      const user = await User.findByPk(payload.id);
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      password,
    },
  });
  console.log(user);
  if (user) {
    return { userId: jwt.sign(user.id, process.env.JWT) };
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
