import bcrypt from "bcrypt";

(async () => {
    const hash = await bcrypt.hash("123", 10);
    console.log("Hash for 123:", hash);
})();
