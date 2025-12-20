
const { register } = require('ts-node');
// Register ts-node to handle TS imports on the fly
register({
    project: './tsconfig.json',
    compilerOptions: {
        module: 'commonjs' // Force commonjs for this execution
    }
});

const prisma = require('./src/lib/db').default;
const { login } = require('./src/actions/auth');
const { createProduct, getAllProducts } = require('./src/actions/product');
const { submitOrder, getPendingOrders } = require('./src/actions/order');
const bcrypt = require('bcryptjs');

async function verify() {
    console.log("Starting Verification (JS Mode)...");

    // 1. Setup User
    const email = `test-js-${Date.now()}@example.com`;
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                email,
                name: "Test User JS",
                password: hashedPassword,
                role: "admin"
            }
        });
        console.log("1. User created");
    } catch (e) {
        console.log("1. User creation failed (maybe exists):", e.message);
    }

    // 2. Test Login
    const loginResult = await login(email, password);
    if (loginResult.user) {
        console.log("2. Login successful");
    } else {
        console.error("2. Login FAILED", loginResult.error);
    }

    // 3. Test Product
    const productResult = await createProduct({
        name: "Test Product JS",
        category: "Lona",
        pricePerM2: 50.0,
        description: "Test Desc",
        image: ""
    });

    if (productResult.success && productResult.product) {
        console.log("3. Product created");
    } else {
        console.error("3. Product creation FAILED");
    }

    const products = await getAllProducts();
    console.log(`   Total products: ${products.length}`);

    // 4. Test Order
    if (productResult.product) {
        const orderResult = await submitOrder({
            productId: productResult.product.id,
            productName: productResult.product.name,
            clientName: "Test Client JS",
            width: 2,
            height: 1,
            quantity: 1,
            totalPrice: 100,
            instructions: "Test order JS"
        });

        if (orderResult.success) {
            console.log("4. Order submitted");
        } else {
            console.error("4. Order FAILED", orderResult.error);
        }

        const orders = await getPendingOrders();
        console.log(`   Pending orders: ${orders.length}`);
    }

    console.log("Verification Complete.");
}

verify()
    .catch(e => console.error(e))
    .finally(async () => {
        if (prisma) await prisma.$disconnect();
    });
