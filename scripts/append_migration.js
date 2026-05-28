const fs = require('fs');
const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260528000001_add_likes_and_subscribers.sql', 'utf8');
const updatedSchema = schema.replace("NOTIFY pgrst, 'reload schema';", migration + "\n\nNOTIFY pgrst, 'reload schema';\n");
fs.writeFileSync('supabase/schema.sql', updatedSchema);
console.log("schema.sql updated.");
