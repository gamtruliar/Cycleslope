import './styles/base.css';
import App from './App.svelte';

const mountPoint = document.getElementById('app');

if (!mountPoint) {
  throw new Error('Failed to initialise application: mount point "#app" was not found.');
}

const app = new App({
  target: mountPoint,
});

export default app;
