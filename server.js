require("dotenv").config();
const app = require("./src/app");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Ingress server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});
