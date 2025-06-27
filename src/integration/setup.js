export async function setup() {
  // Setup für Integrationstests
  console.log('Integration tests setup started');
  return () => {
    // Teardown-Funktion
    console.log('Integration tests teardown completed');
  }
}