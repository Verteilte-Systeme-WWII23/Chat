// Keine direkten vi-Importe in Setup-Dateien!

// Statt vi zu verwenden, setzen wir Umgebungsvariablen direkt
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.NODE_ENV = 'test';

// Mock für externe API kann in den einzelnen Tests erfolgen
export async function setup() {
  console.log('Integration tests setup started');
  return () => {
    console.log('Integration tests teardown completed');
  };
}