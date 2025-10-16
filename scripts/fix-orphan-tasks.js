import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env (expects VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('❌ Missing SUPABASE envs: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRole);

async function ensureUncategorizedCategory() {
  // Try to find by slug/name first, then by display_name in Hebrew
  const { data: existing, error: findErr } = await supabase
    .from('categories')
    .select('*')
    .in('name', ['uncategorized'])
    .limit(1);
  if (findErr) throw findErr;
  if (existing && existing.length > 0) return existing[0];

  const { data: existingByDisplay, error: findHeb } = await supabase
    .from('categories')
    .select('*')
    .eq('display_name', 'ללא קטגוריה')
    .limit(1);
  if (findHeb) throw findHeb;
  if (existingByDisplay && existingByDisplay.length > 0) return existingByDisplay[0];

  // Create one at the end
  const { data: allCats, error: catErr } = await supabase
    .from('categories')
    .select('order_index');
  if (catErr) throw catErr;
  const maxOrder = allCats && allCats.length > 0 ? Math.max(...allCats.map(c => c.order_index || 0)) : 0;

  const { data: inserted, error: insertErr } = await supabase
    .from('categories')
    .insert({
      name: 'uncategorized',
      display_name: 'ללא קטגוריה',
      order_index: maxOrder + 1,
      color: null,
    })
    .select('*')
    .single();
  if (insertErr) throw insertErr;
  return inserted;
}

async function main() {
  console.log('🔎 Scanning for orphan tasks (tasks with category_id not matching any category)...');

  // Load all category ids
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id');
  if (catErr) throw catErr;
  const catIds = new Set((categories || []).map(c => c.id));

  // Load tasks minimally
  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('id, name, category_id');
  if (taskErr) throw taskErr;

  const orphans = (tasks || []).filter(t => !t.category_id || !catIds.has(t.category_id));
  console.log(`📊 Found ${orphans.length} orphan tasks`);

  if (orphans.length === 0) {
    console.log('✅ No fixes needed');
    return;
  }

  const uncategorized = await ensureUncategorizedCategory();
  console.log(`📁 Using fallback category: ${uncategorized.display_name} (${uncategorized.id})`);

  // Chunk updates to avoid oversized payloads
  const chunkSize = 200;
  for (let i = 0; i < orphans.length; i += chunkSize) {
    const chunk = orphans.slice(i, i + chunkSize);
    const updates = chunk.map(t => ({ id: t.id, category_id: uncategorized.id }));
    const { error: updErr } = await supabase.from('tasks').upsert(updates);
    if (updErr) throw updErr;
    console.log(`✅ Updated ${chunk.length} tasks [${i + 1}-${i + chunk.length}]`);
  }

  console.log('🎉 Done fixing orphan tasks');
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
