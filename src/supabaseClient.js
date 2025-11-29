// src/supabaseClient.js
// Initializes and exports the Supabase client.

// IMPORTANT: Replace these placeholders with your actual Supabase project credentials.
const supabaseUrl = 'https://stvqdvgdhdecytntqqud.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dnFkdmdkaGRlY3l0bnRxcXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzkzMDQsImV4cCI6MjA3OTkxNTMwNH0.NqQAz-KXf5C9y2zq8Iyc5CxrAOCon5qk9FRQ1KmK3bU';

// The global 'supabase' object is available because it's loaded in index.html
// If using modules, we import the function and create the client.
// We must check if 'supabase' is globally available via UMD bundle load (from index.html).
// If not, we'll assume it's imported via ES module context (which is more complex in a single-file environment, but good practice).

let supabase;

// Attempt to use the globally loaded Supabase object
if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized using global window.supabase.");
} else {
    // Fallback/Error case if the global script load failed
    console.error("Could not find global 'supabase' object. Ensure the library script is correctly loaded in index.html.");
    // Export a null client to prevent runtime errors
    supabase = null;
}

export { supabase };

if (supabase && (supabaseUrl.includes('YOUR_SUPABASE') || supabaseAnonKey.includes('YOUR_SUPABASE'))) {
    console.warn("WARNING: Supabase client is initialized but using placeholder credentials. Please update src/supabaseClient.js!");
}