import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseData {
  categories: number;
  tasks: number;
  projects: number;
  sampleCategory: any;
  sampleTask: any;
  sampleProject: any;
}

export default function DatabaseCheck() {
  console.log('DatabaseCheck component loaded');

  return (
    <div>
      <h1>Database Check Page</h1>
      <p>Testing if the component loads</p>
    </div>
  );
}