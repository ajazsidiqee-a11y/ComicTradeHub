const https = require('https');

function resolveSRV(hostname) {
    return new Promise((resolve, reject) => {
        const url = `https://dns.google/resolve?name=_mongodb._tcp.${hostname}&type=SRV`;
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.Answer && json.Answer.length > 0) {
                        const hosts = json.Answer.map(a => {
                            const parts = a.data.split(' ');
                            return { host: parts[3].replace(/\.$/, ''), port: parseInt(parts[2]) };
                        });
                        resolve(hosts);
                    } else {
                        reject(new Error('No SRV records found'));
                    }
                } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

resolveSRV('comictrade.ecdoh9o.mongodb.net')
    .then(hosts => {
        console.log('✅ SRV resolved:', JSON.stringify(hosts));
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    });
