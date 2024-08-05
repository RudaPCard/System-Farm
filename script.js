document.addEventListener('DOMContentLoaded', function() {
    // Carregar usuários salvos do localStorage
    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    users.push(...savedUsers);
});

let users = [
    { email: 'admin@drugstore.com', password: 'admin123' } // Usuário admin para testes
];
let operators = [];
let loggedInUser = null;
let selectedIndex = -1;
const managerPassword = '3103';
let currentProduct = null;

const products = [
    { id: 1, name: 'Aspirina 500mg c/10cpr', price: 10.00 },
    { id: 2, name: 'Paracetamol 500mg c/10cpr', price: 5.00 },
    { id: 3, name: 'Ibuprofeno 600mg c/30cpr', price: 8.00 },
    { id: 4, name: 'Brasart 40mg c/30cpr', price: 8.00 },
    { id: 5, name: 'Ibuprofeno 400mg c/20caps', price: 8.00 },
    { id: 6, name: 'Paracetamol 750mg c/20cpr', price: 8.00 },
    { id: 7, name: 'Glifage XR 500mg', price: 8.00 },
    { id: 8, name: 'Ozempic 1mg c/2 sistemas', price: 1070.00 },
    { id: 9, name: 'Saxenda c/3 sistemas', price: 820.00 },
    // Adicione mais produtos conforme necessário
];

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        loggedInUser = user;
        document.querySelector('.login-container').style.display = 'none';
        loadSecondPage();
    } else {
        alert('Usuário ou senha incorretos.');
    }
}

function showRegistration() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.registration-container').style.display = 'block';
}

function hideRegistration() {
    document.querySelector('.registration-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
}

function registerUser() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (email && password) {
        const newUser = { email, password };
        users.push(newUser);
        // Salvar usuários no localStorage
        localStorage.setItem('users', JSON.stringify(users));
        alert('Usuário cadastrado com sucesso.');
        hideRegistration();
    } else {
        alert('Por favor, preencha todos os campos.');
    }
}

function loadSecondPage() {
    document.body.innerHTML = `
        <div class="second-total">
            <div class="second-page">
                <h1>Drugstore System</h1>
                <h3>Suporte: (77) 9 99674559</h3>
                <h3>Suporte: (77) 9 99674559</h3>           
            </div>

            <div class="second-buttons">
                <button class="botao" onclick="showSalesHistory()">Historico de Vendas do Usuário</button>
                <button class="botao" onclick="showPasswordChange()">Troca de Senha 🤵</button>
                <button class="botao" onclick="showClientHistory()">Histórico de Clientes 🚶‍♂️</button>
                <button class="botao" onclick="showOperatorRegistration()">Cadastrar novos operadores ✔</button>            
            </div>
        </div>

        <div id="pesq-produto">
            <input type="text" id="texto-procurar" placeholder="Procurar Produto" oninput="searchProducts()" onkeydown="handleKeyDown(event)">
            <ul id="product-list"></ul>
        </div>

        <div id="selected-products">
            <h2>Produtos Selecionados:</h2>
            <ul id="selected-product-list"></ul>
        </div>

        <div id="discount-modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h2>Autorização de Desconto</h2>
                <input type="password" id="manager-password" placeholder="Senha do Gerente" oninput="maskPassword(this)">
                <button onclick="authorizeDiscount()">Autorizar</button>
            </div>
        </div>
    `;
}

function searchProducts() {
    const searchText = document.getElementById('texto-procurar').value.toLowerCase();
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    if (searchText) {
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchText));

        filteredProducts.forEach((product, index) => {
            const li = document.createElement('li');
            li.textContent = `${product.name} - R$${product.price.toFixed(2)}`;
            li.onclick = () => selectProduct(product, index);
            productList.appendChild(li);
        });
    }
}

function handleKeyDown(event) {
    const productList = document.getElementById('product-list');
    const items = productList.getElementsByTagName('li');

    if (event.key === 'ArrowDown') {
        selectedIndex = (selectedIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp') {
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
        items[selectedIndex].click();
    }

    for (let i = 0; i < items.length; i++) {
        items[i].style.backgroundColor = i === selectedIndex ? '#f0f0f0' : '#fff';
    }
}

function selectProduct(product, index) {
    currentProduct = product;
    selectedIndex = index;

    const selectedProductList = document.getElementById('selected-product-list');
    const li = document.createElement('li');
    li.dataset.productId = product.id;

    li.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div style="flex: 1;">
                <strong>Produto:</strong> ${product.name} <br>
                <strong>Preço Original:</strong> R$${product.price.toFixed(2)} <br>
                <strong>Preço com Desconto:</strong> <span class="price-with-discount">R$${product.price.toFixed(2)}</span>
            </div>
            <div style="flex: 1;">
                <strong>Quantidade:</strong> <input type="number" value="1" min="1" onchange="updateQuantity(this, ${product.id})"> <br>
                <strong>Desconto:</strong> <input type="number" value="0" min="0" max="100" onchange="updateDiscount(this, ${product.id})"> %
            </div>
            <button onclick="removeProduct(this)">Remover</button>
        </div>
    `;

    selectedProductList.appendChild(li);
    updatePriceWithDiscount(li);
}

function updateQuantity(input, productId) {
    const li = input.closest('li');
    const quantity = parseInt(input.value);
    const price = products.find(product => product.id === productId).price;
    const priceWithDiscount = parseFloat(li.querySelector('.price-with-discount').textContent.replace('R$', ''));
    const newPrice = priceWithDiscount * quantity;

    li.querySelector('strong:nth-of-type(2)').textContent = `Preço Original: R$${(price * quantity).toFixed(2)}`;
    li.querySelector('.price-with-discount').textContent = `R$${newPrice.toFixed(2)}`;
}

function updateDiscount(input, productId) {
    const li = input.closest('li');
    const discount = parseInt(input.value);
    const price = products.find(product => product.id === productId).price;
    const priceWithDiscount = price * (1 - discount / 100);

    li.querySelector('.price-with-discount').textContent = `R$${(priceWithDiscount * parseInt(li.querySelector('input[type="number"]').value)).toFixed(2)}`;
}

function updatePriceWithDiscount(li) {
    const discountInput = li.querySelector('input[type="number"]');
    const discount = parseInt(discountInput.value);
    const price = products.find(product => product.id === parseInt(li.dataset.productId)).price;
    const priceWithDiscount = price * (1 - discount / 100);
    li.querySelector('.price-with-discount').textContent = `R$${priceWithDiscount.toFixed(2)}`;
}

function removeProduct(button) {
    button.closest('li').remove();
}

function showDiscountModal() {
    document.getElementById('discount-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('discount-modal').style.display = 'none';
}

function maskPassword(input) {
    input.type = 'password';
}

function authorizeDiscount() {
    const password = document.getElementById('manager-password').value;
    if (password === managerPassword) {
        alert('Desconto autorizado!');
        closeModal();
    } else {
        alert('Senha incorreta.');
    }
}