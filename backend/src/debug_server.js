
console.log('Current NODE_ENV:', process.env.NODE_ENV);
try {
    console.log('Attempting to import server...');
    import('./server.js').then((module) => {
        console.log('Import successful.');
        console.log('Export keys:', Object.keys(module));
        // Keep alive to see if it stays up
        setTimeout(() => {
            console.log('Debug timeout reached (10s), exiting check.');
        }, 10000);
    }).catch(err => {
        console.error('Import failed promise:', err);
    });
} catch (error) {
    console.error('Synchronous error:', error);
}
