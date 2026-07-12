const { createClient } = require('@supabase/supabase-js');

const url = "https://hiqixhmmquugcifdtaep.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpcWl4aG1tcXV1Z2NpZmR0YWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwMTA5MywiZXhwIjoyMDk1ODc3MDkzfQ._EIH7IhIJobz6MrTstkniYjImRAIVfGv57WOOcAF-Jg";

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('bootcamp_registrations').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Registrations (" + data.length + "):");
    data.forEach(r => {
      console.log(`- ID: ${r.id}, Email: "${r.email}", Name: "${r.name}", Course: "${r.course}"`);
    });
  }
}
run();
