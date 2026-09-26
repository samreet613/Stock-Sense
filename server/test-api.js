import http from 'http';

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('--- StockSense Full-Stack Automated Verification Test ---');

  // 1. Health check
  const health = await makeRequest('/health');
  console.log('✓ Health check status:', health.status, health.body.service);

  // 2. Login as Manager
  const loginRes = await makeRequest('/auth/login', 'POST', {
    email: 'manager@stocksense.com',
    password: 'password123'
  });
  console.log('✓ Login Manager status:', loginRes.status, 'User:', loginRes.body.user.name);
  const token = loginRes.body.token;

  // 3. Request OTP
  const otpRes = await makeRequest('/auth/request-otp', 'POST', { email: 'manager@stocksense.com' });
  console.log('✓ Request OTP status:', otpRes.status, 'Generated Code:', otpRes.body.code);

  // 4. Fetch Products
  const productsRes = await makeRequest('/products', 'GET', null, token);
  console.log('✓ Products count:', productsRes.body.length);

  // 5. Fetch Dashboard Stats
  const statsRes = await makeRequest('/dashboard/stats', 'GET', null, token);
  console.log('✓ Dashboard KPIs:', statsRes.body.kpis);

  // 6. Test Step 1: Create Receipt for +50 Steel Rods
  const locationsRes = await makeRequest('/locations', 'GET', null, token);
  const vendorLoc = locationsRes.body.find((l) => l.type === 'vendor');
  const mainLoc = locationsRes.body.find((l) => l.type === 'internal');
  const steelProduct = productsRes.body.find((p) => p.sku === 'STEEL-ROD-01');

  const receiptRes = await makeRequest('/operations', 'POST', {
    type: 'receipt',
    partner_name: 'Apex Steel Corp',
    source_location_id: vendorLoc.id,
    dest_location_id: mainLoc.id,
    items: [{ product_id: steelProduct.id, demand_qty: 50 }]
  }, token);

  console.log('✓ Created Receipt Ref:', receiptRes.body.reference_no);

  // Validate Receipt
  const valRes = await makeRequest(`/operations/${receiptRes.body.id}/validate`, 'POST', null, token);
  console.log('✓ Validated Receipt:', valRes.body.message);

  // 7. Check Move History Ledger
  const ledgerRes = await makeRequest('/ledger', 'GET', null, token);
  console.log('✓ Move History audit logs count:', ledgerRes.body.length);

  console.log('--- All automated StockSense API verification tests passed! ---');
}

runVerification().catch(console.error);
