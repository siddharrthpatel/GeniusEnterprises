/** (developed by @neelotpal.dey) **/
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.getElementById('nav-links');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const floatingContacts = document.getElementById('floating-contacts');

// =========================================
// NAVIGATION LOGIC
// =========================================

const moreDropdown = document.querySelector('.dropdown-content');
const moreBtn = document.querySelector('.dropbtn');

function isMobile() {
    return window.innerWidth <= 1150;
}

function closeMenu() {
    if (navLinks) navLinks.classList.remove('active');
    if (moreDropdown) moreDropdown.classList.remove('open');
    if (moreBtn) {
        const icon = moreBtn.querySelector('i.fa-chevron-down');
        if (icon) icon.classList.remove('rotated');
    }
    if (mobileMenu) mobileMenu.querySelector('i').className = 'fas fa-bars';
}

// --- Hamburger toggle ---
if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('active');
        this.querySelector('i').className = isOpen ? 'fas fa-times' : 'fas fa-bars';
        if (!isOpen && moreDropdown) {
            moreDropdown.classList.remove('open');
            const icon = moreBtn && moreBtn.querySelector('i.fa-chevron-down');
            if (icon) icon.classList.remove('rotated');
        }
    });
}

// --- More dropdown toggle (mobile only, JS-driven) ---
if (moreBtn && moreDropdown) {
    moreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isMobile()) return; // Desktop uses CSS :hover

        const isOpen = moreDropdown.classList.toggle('open');
        const icon = this.querySelector('i.fa-chevron-down');
        if (icon) icon.classList.toggle('rotated', isOpen);
    });
}

// --- All nav link clicks: smooth scroll + close menu ---
document.querySelectorAll('.nav-links a:not(.dropbtn)').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || !href.startsWith('#') || href === '#') return;

        e.preventDefault();

        // Calculator links — set mode then scroll to section
        const calcMap = {
            '#sip-calculator':      'sip',
            '#lumpsum-calculator':  'lumpsum',
            '#swp-calculator':      'swp',
            '#mf-returns-calculator': 'mf',
            '#fd-calculator':       'fd',
            '#rd-calculator':       'rd',
            '#ppf-calculator':      'ppf',
            '#epf-calculator':      'epf',
            '#ssy-calculator':      'ssy',
            '#emi-calculator':      'emi',
            '#tax-calculator':      'tax',
            '#gst-calculator':      'gst'
        };

        if (calcMap[href]) {
            setCalcMode(calcMap[href]);
            const calcSection = document.getElementById('calculators');
            if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }

        // Always close the mobile menu after navigating
        if (isMobile()) closeMenu();
    });
});

// --- Close menu when tapping outside navbar ---
document.addEventListener('click', function(e) {
    if (!isMobile()) return;
    if (!navLinks || !navLinks.classList.contains('active')) return;
    const topBar = document.getElementById('top-bar');
    if (topBar && !topBar.contains(e.target)) closeMenu();
});

// =========================================
// SCROLL TO TOP & HEADER LOGIC
// =========================================
let isScrolled = false;
window.addEventListener('scroll', () => {
    // Header shrink logic with hysteresis to prevent flickering
    const topBar = document.getElementById('top-bar');
    if (window.scrollY > 150) {
        if (!isScrolled) {
            if (topBar) topBar.classList.add('scrolled');
            isScrolled = true;
        }
    } else if (window.scrollY < 50) {
        if (isScrolled) {
            if (topBar) topBar.classList.remove('scrolled');
            isScrolled = false;
        }
    }

    // Scroll to top & floating buttons logic
    if (window.scrollY > 300) {
        if (scrollTopBtn) scrollTopBtn.classList.add('show');
        if (floatingContacts) floatingContacts.classList.add('show');
    } else {
        if (scrollTopBtn) scrollTopBtn.classList.remove('show');
        if (floatingContacts) floatingContacts.classList.remove('show');
    }
});

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// =========================================
// CALCULATOR LOGIC
// =========================================
let currentCalcMode = 'sip';
const invAmount = document.getElementById('invAmount');
const invAmountSlider = document.getElementById('invAmountSlider');

const swpWithdrawalGroup = document.getElementById('swp-withdrawal-group');
const swpWithdrawal = document.getElementById('swpWithdrawal');
const swpWithdrawalSlider = document.getElementById('swpWithdrawalSlider');

const ssyAgeGroup = document.getElementById('ssy-age-group');
const ssyAge = document.getElementById('ssyAge');
const ssyAgeSlider = document.getElementById('ssyAgeSlider');

const ssyYearGroup = document.getElementById('ssy-year-group');
const ssyYear = document.getElementById('ssyYear');

const epfAgeGroup = document.getElementById('epf-age-group');
const epfAge = document.getElementById('epfAge');
const epfAgeSlider = document.getElementById('epfAgeSlider');

const taxOtherIncomeGroup = document.getElementById('tax-other-income-group');
const taxOtherIncome = document.getElementById('taxOtherIncome');
const taxOtherIncomeSlider = document.getElementById('taxOtherIncomeSlider');

const gstTypeGroup = document.getElementById('gst-type-group');
const gstType = document.getElementById('gstType');

const fdFreqGroup = document.getElementById('fd-freq-group');
const fdFreq = document.getElementById('fdFreq');

const invRateGroup = document.getElementById('inv-rate-group');
const invRate = document.getElementById('invRate');
const invRateSlider = document.getElementById('invRateSlider');

const invYearsGroup = document.getElementById('inv-years-group');
const invYears = document.getElementById('invYears');
const invYearsSlider = document.getElementById('invYearsSlider');

const totalInvestmentEl = document.getElementById('totalInvestment');
const estReturnsEl = document.getElementById('estReturns');
const totalValueEl = document.getElementById('totalValue');

const l1 = document.getElementById('res-label-1');
const l2 = document.getElementById('res-label-2');
const l3 = document.getElementById('res-label-3');

document.querySelectorAll('.calc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        setCalcMode(tab.dataset.type);
    });
});

function setCalcMode(mode) {
    currentCalcMode = mode;
    
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === mode);
    });

    const calcTypes = ['sip', 'lumpsum', 'swp', 'mf', 'ssy', 'tax', 'ppf', 'epf', 'gst', 'fd', 'rd', 'emi'];
    calcTypes.forEach(type => {
        const infoEl = document.getElementById(`${type}-info`);
        if (infoEl) {
            infoEl.style.display = mode === type ? 'block' : 'none';
        }
    });
    
    swpWithdrawalGroup.style.display = 'none';
    ssyAgeGroup.style.display = 'none';
    ssyYearGroup.style.display = 'none';
    epfAgeGroup.style.display = 'none';
    taxOtherIncomeGroup.style.display = 'none';
    gstTypeGroup.style.display = 'none';
    fdFreqGroup.style.display = 'none';
    invRateGroup.style.display = 'block';
    invYearsGroup.style.display = 'block';
    
    invAmountSlider.min = 500;
    invRateGroup.querySelector('label').innerText = 'Expected Return Rate (p.a %)';
    invRateSlider.max = 30;

    if (mode === 'emi') {
        document.getElementById('calc-amount-label').innerText = 'Loan Amount (₹)';
        invRateGroup.querySelector('label').innerText = 'Interest Rate (p.a %)';
        invYearsGroup.querySelector('label').innerText = 'Loan Tenure (Years)';
        
        l1.innerText = 'Monthly EMI';
        l2.innerText = 'Total Interest Payable';
        l3.innerText = 'Total Payment (Principal + Interest)';

        invAmountSlider.max = 50000000; 
        invAmountSlider.min = 10000;
        if(parseFloat(invAmount.value) < 10000 || parseFloat(invAmount.value) > 50000000) {
            invAmount.value = 1000000;
            invAmountSlider.value = 1000000;
        }
        
        if(parseFloat(invRate.value) > 30) {
            invRate.value = 8.5;
            invRateSlider.value = 8.5;
        }
    }
    else if (mode === 'rd') {
        document.getElementById('calc-amount-label').innerText = 'Monthly Investment (₹)';
        l1.innerText = 'Total Investment';
        l2.innerText = 'Total Interest';
        l3.innerText = 'Maturity Amount';

        invAmountSlider.max = 150000;
        invAmountSlider.min = 500;
        if(parseFloat(invAmount.value) > 150000 || parseFloat(invAmount.value) < 500) {
            invAmount.value = 5000;
            invAmountSlider.value = 5000;
        }
    }
    else if (mode === 'fd') {
        fdFreqGroup.style.display = 'block';
        document.getElementById('calc-amount-label').innerText = 'Total Investment (₹)';
        l1.innerText = 'Total Investment';
        l2.innerText = 'Total Interest';
        l3.innerText = 'Maturity Amount';

        invAmountSlider.max = 10000000; 
        if(parseFloat(invAmount.value) <= 5000) {
            invAmount.value = 100000;
            invAmountSlider.value = 100000;
        }
    }
    else if (mode === 'gst') {
        invYearsGroup.style.display = 'none';
        gstTypeGroup.style.display = 'block';
        invRateGroup.querySelector('label').innerText = 'GST Rate (%)';
        invRateSlider.max = 50; 
        
        invAmountSlider.max = 5000000;
        invAmountSlider.min = 100;
        if(parseFloat(invAmount.value) > 5000000) {
            invAmount.value = 10000;
            invAmountSlider.value = 10000;
        }
        if(parseFloat(invRate.value) > 50) {
            invRate.value = 18;
            invRateSlider.value = 18;
        }
        updateGstLabels();
    }
    else if (mode === 'epf') {
        invYearsGroup.style.display = 'none';
        epfAgeGroup.style.display = 'block';

        document.getElementById('calc-amount-label').innerText = 'Monthly Basic Salary + DA (₹)';
        l1.innerText = 'Total EPF Contribution';
        l2.innerText = 'Total Interest';
        l3.innerText = 'Maturity Amount';

        invAmountSlider.max = 500000; 
        if(parseFloat(invAmount.value) > 500000) {
            invAmount.value = 50000;
            invAmountSlider.value = 50000;
        }
        
        invRate.value = 8.15; 
        invRateSlider.value = 8.15;
    }
    else if (mode === 'tax') {
        invRateGroup.style.display = 'none';
        invYearsGroup.style.display = 'none';
        taxOtherIncomeGroup.style.display = 'block';

        document.getElementById('calc-amount-label').innerText = 'Gross Annual Salary (₹)';
        l1.innerText = 'Total Taxable Income';
        l2.innerText = 'Income Tax (Base)';
        l3.innerText = 'Total Tax Due (Inc. Cess)';

        invAmountSlider.max = 5000000; 
        invAmountSlider.min = 0;
        if(parseFloat(invAmount.value) > 5000000) {
            invAmount.value = 1800000; 
            invAmountSlider.value = 1800000;
        }
    }
    else if (mode === 'ppf') {
        invRateGroup.style.display = 'none'; 
        invYearsGroup.style.display = 'block';

        document.getElementById('calc-amount-label').innerText = 'Yearly Investment (₹)';
        l1.innerText = 'Total Investment';
        l2.innerText = 'Total Interest';
        l3.innerText = 'Maturity Value';

        invAmountSlider.max = 150000; 
        invAmountSlider.min = 500;
        if(parseFloat(invAmount.value) > 150000 || parseFloat(invAmount.value) < 500) {
            invAmount.value = 150000;
            invAmountSlider.value = 150000;
        }
    }
    else if (mode === 'ssy') {
        invRateGroup.style.display = 'none';
        invYearsGroup.style.display = 'none';
        ssyAgeGroup.style.display = 'block';
        ssyYearGroup.style.display = 'block';

        document.getElementById('calc-amount-label').innerText = 'Yearly Investment (₹)';
        l1.innerText = 'Total Investment';
        l2.innerText = 'Maturity Year';
        l3.innerText = 'Maturity Amount';

        invAmountSlider.max = 150000; 
        invAmountSlider.min = 250;
        if(parseFloat(invAmount.value) > 150000 || parseFloat(invAmount.value) < 250) {
            invAmount.value = 50000;
            invAmountSlider.value = 50000;
        }
    } else if (mode === 'swp') {
        swpWithdrawalGroup.style.display = 'block';
        document.getElementById('calc-amount-label').innerText = 'Total Investment (₹)';
        l1.innerText = 'Total Investment';
        l2.innerText = 'Total Withdrawal';
        l3.innerText = 'Final Balance';

        invAmountSlider.max = 50000000; 
        if(parseFloat(invAmount.value) < 500000) {
            invAmount.value = 1000000;
            invAmountSlider.value = 1000000;
        }
    } else {
        l1.innerText = 'Invested Amount';
        l2.innerText = 'Est. Returns';
        l3.innerText = 'Total Expected Value';

        if (mode === 'sip') {
            document.getElementById('calc-amount-label').innerText = 'Monthly Investment (₹)';
            invAmountSlider.max = 100000;
            if(parseFloat(invAmount.value) > 100000) {
                invAmount.value = 5000;
                invAmountSlider.value = 5000;
            }
        } else {
            // Lumpsum and MF Returns Mode share identical inputs
            document.getElementById('calc-amount-label').innerText = 'Investment Amount (₹)';
            invAmountSlider.max = 10000000; 
            if(parseFloat(invAmount.value) <= 5000) {
                invAmount.value = 100000; 
                invAmountSlider.value = 100000;
            }
        }
    }

    calculateReturns();
}

function updateGstLabels() {
    if (currentCalcMode !== 'gst') return;
    let type = gstType.value;
    document.getElementById('calc-amount-label').innerText = type === 'add' ? 'Original Cost (₹)' : 'Net Price / Inclusive Amount (₹)';
    l1.innerText = type === 'add' ? 'Original Cost' : 'Net Price';
    l2.innerText = 'GST Amount';
    l3.innerText = type === 'add' ? 'Total Inclusive Price' : 'Original Exclusive Cost';
}

if (gstType) {
    gstType.addEventListener('change', () => {
        updateGstLabels();
        calculateReturns();
    });
}

if (fdFreq) {
    fdFreq.addEventListener('change', calculateReturns);
}

function formatCurrency(num) {
    return '₹ ' + Math.round(num).toLocaleString('en-IN');
}

function calculateReturns() {
    if (!invAmount) return;
    
    let P = parseFloat(invAmount.value) || 0;
    let annualRate = parseFloat(invRate.value) || 0;
    let t = parseFloat(invYears.value) || 0;

    let val1 = 0, val2 = 0, val3 = 0;

    if (currentCalcMode === 'emi') {
        let r = annualRate / 12 / 100;
        let n = t * 12; // Months
        
        let emi = 0;
        if (r === 0) {
            emi = P / n;
        } else {
            emi = P * r * (Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }
        
        val3 = emi * n; 
        val2 = val3 - P; 
        val1 = emi; 
    }
    else if (currentCalcMode === 'rd') {
        let r = annualRate / 100;
        let n = 4; 
        let months = t * 12;
        
        val1 = P * months;
        val3 = 0;
        
        if (r === 0) {
            val3 = val1;
        } else {
            for (let j = 1; j <= months; j++) {
                let timeInYears = (months - j + 1) / 12;
                val3 += P * Math.pow(1 + r/n, n * timeInYears);
            }
        }
        val2 = val3 - val1;
    }
    else if (currentCalcMode === 'fd') {
        let n = parseFloat(fdFreq.value) || 4; 
        let r = annualRate / 100;
        
        val1 = P;
        val3 = P * Math.pow((1 + (r / n)), (n * t));
        val2 = val3 - val1;
    }
    else if (currentCalcMode === 'gst') {
        let type = gstType.value;
        if (type === 'add') {
            val1 = P; 
            val2 = (P * annualRate) / 100; 
            val3 = P + val2; 
        } else {
            val1 = P; 
            val3 = P / (1 + (annualRate / 100)); 
            val2 = P - val3; 
        }
    }
    else if (currentCalcMode === 'epf') {
        let age = parseFloat(epfAge.value) || 25;
        let yearsRemaining = Math.max(0, 58 - age); 
        let r = annualRate / 100;
        let i = r / 12; 
        let n = yearsRemaining * 12;
        
        let monthlyContribution = P * 0.1567; 
        
        val1 = monthlyContribution * n; 
        
        if (i === 0) {
            val3 = val1;
        } else {
            val3 = monthlyContribution * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
        }
        val2 = val3 - val1;
    }
    else if (currentCalcMode === 'tax') {
        let grossSalary = P;
        let otherIncome = parseFloat(taxOtherIncome.value) || 0;
        let standardDeduction = 75000;
        
        let netTaxableIncome = Math.max(0, grossSalary - standardDeduction) + otherIncome;
        val1 = netTaxableIncome;

        let tax = 0;
        let income = netTaxableIncome;

        if (income > 2400000) { tax += (income - 2400000) * 0.30; income = 2400000; }
        if (income > 2000000) { tax += (income - 2000000) * 0.25; income = 2000000; }
        if (income > 1600000) { tax += (income - 1600000) * 0.20; income = 1600000; }
        if (income > 1200000) { tax += (income - 1200000) * 0.15; income = 1200000; }
        if (income > 800000)  { tax += (income - 800000) * 0.10;  income = 800000;  }
        if (income > 400000)  { tax += (income - 400000) * 0.05;  income = 400000;  }

        if (netTaxableIncome <= 1200000) { tax = 0; }

        val2 = tax; 
        val3 = tax + (tax * 0.04); 
    }
    else if (currentCalcMode === 'ppf') {
        let r = 0.071; 
        val1 = P * t; 
        if (r === 0) {
            val3 = val1;
        } else {
            val3 = P * (((Math.pow(1 + r, t) - 1) / r) * (1 + r));
        }
        val2 = val3 - val1;
    }
    else if (currentCalcMode === 'ssy') {
        let r = 0.082; 
        val1 = P * 15; 
        let expected15 = P * (((Math.pow(1 + r, 15) - 1) / r) * (1 + r));
        val3 = expected15 * Math.pow(1 + r, 6); 
        let startYear = parseInt(ssyYear.value) || new Date().getFullYear();
        val2 = startYear + 21; 
    }
    else if (currentCalcMode === 'sip') {
        let i = annualRate / 12 / 100;
        let n = t * 12;
        val1 = P * n;
        if (i === 0) {
            val3 = val1;
        } else {
            val3 = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
        }
        val2 = val3 - val1;
    } 
    else if (currentCalcMode === 'lumpsum' || currentCalcMode === 'mf') {
        val1 = P;
        val3 = P * Math.pow(1 + (annualRate / 100), t);
        val2 = val3 - val1;
    } 
    else if (currentCalcMode === 'swp') {
        let W = parseFloat(swpWithdrawal.value) || 0;
        let i = annualRate / 12 / 100;
        let n = t * 12;
        
        val1 = P; 
        val2 = W * n; 
        
        if (i === 0) {
            val3 = P - val2;
        } else {
            val3 = P * Math.pow(1 + i, n) - (W * (Math.pow(1 + i, n) - 1) / i);
        }
        if (val3 < 0) val3 = 0; 
    }

    totalInvestmentEl.innerText = formatCurrency(val1);
    totalValueEl.innerText = formatCurrency(val3);

    if (currentCalcMode === 'ssy') {
        estReturnsEl.innerText = val2; 
    } else {
        estReturnsEl.innerText = formatCurrency(val2);
    }
}

function syncInputs(inputEl, sliderEl) {
    if (!inputEl || !sliderEl) return;
    
    inputEl.addEventListener('input', () => {
        sliderEl.value = inputEl.value;
        calculateReturns();
    });
    
    sliderEl.addEventListener('input', () => {
        inputEl.value = sliderEl.value;
        calculateReturns();
    });
}

syncInputs(invAmount, invAmountSlider);
syncInputs(swpWithdrawal, swpWithdrawalSlider);
syncInputs(ssyAge, ssyAgeSlider);
syncInputs(epfAge, epfAgeSlider);
syncInputs(taxOtherIncome, taxOtherIncomeSlider);
syncInputs(invRate, invRateSlider);
syncInputs(invYears, invYearsSlider);

if (ssyYear) { ssyYear.addEventListener('input', calculateReturns); }

if(invAmount) {
    calculateReturns();
}