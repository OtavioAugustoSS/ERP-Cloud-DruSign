import { Order, OrderInput, OrderStatus } from '../types';

// Mock Database State
let MOCK_ORDERS: Order[] = [
    // Active Orders
    {
        id: '4029',
        clientName: 'Agência Vanguarda',
        width: 200, height: 100, quantity: 1, productId: '1', totalPrice: 1250.00, serviceType: 'promocional', finishing: 'bainha_ilhos', instructions: '',
        status: OrderStatus.PENDING,
        createdAt: new Date('2023-10-24'),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjC0AEZwqwnMWagbaZ2jg7me4jRIOZh39_o1et6h5hZhvdnGLFbBi04r8YleF5Aj0y2COnrdHFGDQBaBAOLgLA7popO9XAIgNOoCVSZvFX9dNMrIbNVQ-_KKXAqTLPwlfEQ1p_pX9MZNW2ENqfboDPEsSyjNg-8n_SNuHyi7i2dcsnLSf8yo6OTj1cTNMXSXKAoWfgP4Ul6iDZ-OMLyROIMacuX0mqyqLns1hq-jeCBYGw4KI9CYonHalfzKVWqxpe1_bGtTHR5XGy"
    },
    {
        id: '4028',
        clientName: 'Tech Solutions Ltda',
        width: 500, height: 200, quantity: 2, productId: '5', totalPrice: 4890.50, serviceType: 'grandes_formatos', finishing: 'sem_acabamento', instructions: '',
        status: OrderStatus.IN_PRODUCTION,
        createdAt: new Date('2023-10-22'),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqhPaI50zKDs3bFg1K4gFgiuIRj_dHVHubtmPEA6pZqzQbcgzh5R2tEl7-F3nJLz9EwnREswkr8gkEx-7Qo2FQwdAsUFNrPRT6RpMNCLCaXhs_1_tnO3luhPHeNyiOM724XHaOsy-gCmB-Ckf4UtNWqvAhLq9dZ0MYtHWVPDalgPj7_0FMKrxViTpp9y9o8UU7Y0fj0eygOPyqiNGXHIuAnHMgzGmJ8B89_gihqif6FdBj9RhKO5hb-_6S-DOTWDU-Sj8qxoo8EIOC"
    },
    {
        id: '4027',
        clientName: 'Café do Centro',
        width: 100, height: 100, quantity: 5, productId: '3', totalPrice: 320.00, serviceType: 'promocional', finishing: 'sem_acabamento', instructions: '',
        status: OrderStatus.PENDING,
        createdAt: new Date('2023-10-26'),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuApItaoSHe7ASE6LAlAIeSEA-8lJQDlJbvuxQaJ1Ao8mLpl1RMYl65_jRajw9iOWMyEpPsu_13yh7fTbIEVpXODa-Y9Ytw_bfgp6YZhxzcIhE7jgzSWH4fvl-XC9lj6GB9s9QjNJzI6sYdcnjBQKJxBav1H8vLFfThCZDjbjzpXCpdOEHMRgV9sE8mJ7OCwp7nfuSdMqfwYCQRXpT8O2ktKzE-uu5ruZ_uY2KwRQI0YWobFhsR7yYCJIU_JlmxA7C5mtoNhRMiG86hu"
    },
    {
        id: '4025',
        clientName: 'Academia PowerFit',
        width: 150, height: 200, quantity: 1, productId: '2', totalPrice: 850.00, serviceType: 'promocional', finishing: 'bastao_corda', instructions: '',
        status: OrderStatus.READY_FOR_SHIPPING,
        createdAt: new Date('2023-10-20'),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAF64UXZB4Yw4hVSUZZzBL5QP8lpXE4PHPfJXxigdYdounjzjOC2PloQAUKB4_48oT06XBW-CGg46GotLbfGIN8ZXnUUIhuMYVofnA_zx7rTkjz7Fx5uQtrRls0Y6k5ns4IOfez2aatNBrkM6zsjDmmmo4PThd8DD0FxC0rHHTozJzRr061QboUFtZbm2yz_e5-D63rX4xbQLnrgS_dZoYRJcbfXH4ds9i1Q8UbGHOxjzg80E14J_PbFWhCx2hsWfry1cywjiJHmZyP"
    },
    {
        id: '4024',
        clientName: 'Studio Design',
        width: 50, height: 50, quantity: 10, productId: '4', totalPrice: 145.90, serviceType: 'promocional', finishing: 'sem_acabamento', instructions: '',
        status: OrderStatus.READY_FOR_SHIPPING,
        createdAt: new Date('2023-10-21'),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCB0WJtlOMPVJTUquXTE5l0vMOG4-XpOhey1jYsbiWDkgP1-P082oNZNv2kB5R9wHx6MMAHAD_vA2cHxpu6JtfoHBgs7fjNgCwlJ0Gq8D03PdHJI5BGOybpx6rVaPNUjiTxpyFS4l_ZPs2vxJ_JuDVuQX_ByIuvDvOBlSUmZSDpVeZQuK1YjwaYjoU0GsxSnFTMZtGwVqSx7dhmLCKfbcd0aEQ0qyy6X-Wsob059XrciZXjtInZYj0tmGyWJ3gU2NmNxmsIJhnN-Qa-"
    },
    {
        id: '4022',
        clientName: 'Events Corp',
        width: 400, height: 300, quantity: 1, productId: '1', totalPrice: 2450.00, serviceType: 'outdoor', finishing: 'bainha_ilhos', instructions: '',
        status: OrderStatus.IN_PRODUCTION,
        createdAt: new Date('2023-10-23'),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrM88btLAAIhUlojpZrSq413etyfkjiv43vuEnTq5k-qr9760Grb4FJrrkSlpeVU3kNX9-4o7YLCmgiBRVtMN4kBFWyujEXUF2_gs4NQDR1Ex8faCwVIH3hIWBJuW9rwO0GSj-U7euonJE-QQtrqBGPiHr76DWvHSgGuBGyNIpHEapCBK_nfMIclfI9fmH5Bd6H3cUkGHIzpCGZm6nrD32WcwKCaNy0rVSeKLXXaYKMmfI_PKKwXGh8DQeYq4OVWR8K7Hkk8ogJ5xk"
    },
    // History Orders (Completed/Cancelled)
    {
        id: '3980',
        clientName: 'Agência Vanguarda',
        width: 200, height: 100, quantity: 1, productId: '1', totalPrice: 1250.00, serviceType: 'promocional', finishing: 'bainha_ilhos', instructions: '',
        status: OrderStatus.COMPLETED,
        createdAt: new Date('2023-10-15')
    },
    {
        id: '3978',
        clientName: 'Tech Solutions Ltda',
        width: 500, height: 200, quantity: 2, productId: '5', totalPrice: 4890.50, serviceType: 'grandes_formatos', finishing: 'sem_acabamento', instructions: '',
        status: OrderStatus.COMPLETED,
        createdAt: new Date('2023-10-12')
    },
    {
        id: '3975',
        clientName: 'Café do Centro',
        width: 100, height: 100, quantity: 5, productId: '3', totalPrice: 320.00, serviceType: 'promocional', finishing: 'sem_acabamento', instructions: '',
        status: OrderStatus.CANCELLED,
        createdAt: new Date('2023-10-10')
    },
    {
        id: '3972',
        clientName: 'Academia PowerFit',
        width: 150, height: 200, quantity: 1, productId: '2', totalPrice: 850.00, serviceType: 'promocional', finishing: 'bastao_corda', instructions: '',
        status: OrderStatus.COMPLETED,
        createdAt: new Date('2023-10-08')
    },
    {
        id: '3969',
        clientName: 'Studio Design',
        width: 50, height: 50, quantity: 10, productId: '4', totalPrice: 145.90, serviceType: 'promocional', finishing: 'sem_acabamento', instructions: '',
        status: OrderStatus.COMPLETED,
        createdAt: new Date('2023-10-05')
    },
    {
        id: '3965',
        clientName: 'Events Corp',
        width: 400, height: 300, quantity: 1, productId: '1', totalPrice: 2450.00, serviceType: 'outdoor', finishing: 'bainha_ilhos', instructions: '',
        status: OrderStatus.COMPLETED,
        createdAt: new Date('2023-10-03')
    }
];

export const submitOrder = async (orderData: OrderInput): Promise<{ success: boolean; order?: Order; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!orderData.productId) {
        return { success: false, error: "Produto inválido." };
    }

    const newOrder: Order = {
        ...orderData,
        id: Math.floor(Math.random() * 9000 + 1000).toString(), // Simple 4 digit ID
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdDzE45UUoB0Hy22XsArw0fQwBRmfLU6F4qca49Q9xdeDIdP9Ys6d5dYRxjgh1fYJWVhj11zcy_4-svx4WgC7pp5j9bFFbqxH30S5u1Kr0TZqcIGyDuC-xDTmL6aeP0MW_90b6pK1BRmfSxlLFuN_VX-GFKHFTUpdP6xW0YWZjeIjTQWct1aonUkyHOZzSXX6lrn0HxTP3llm-3dZRAd7DG2-X0GbEy12w5jMYXsIROFNKNVM60UjAiDQvFSgnJovi52EnBNXYiuQa" // Default placeholder
    };

    MOCK_ORDERS.unshift(newOrder); // Add to beginning
    console.log("Order submitted:", newOrder);

    return { success: true, order: newOrder };
};

export const getPendingOrders = async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_ORDERS.filter(o =>
        [OrderStatus.PENDING, OrderStatus.IN_PRODUCTION, OrderStatus.READY_FOR_SHIPPING].includes(o.status)
    );
};

export const getHistoryOrders = async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_ORDERS.filter(o =>
        [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)
    );
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = MOCK_ORDERS.findIndex(o => o.id === id);
    if (index !== -1) {
        MOCK_ORDERS[index].status = status;
        // Force re-render if using real DB, here we modify reference
        return { success: true };
    }
    return { success: false };
};
