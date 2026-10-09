import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './LandingPage.css';
import MarketTicker from '../components/MarketTicker';

export default function LandingPage() {
    const [tickerHost, setTickerHost] = useState(null);

    useEffect(() => {
        const attach = () => {
            const host = document.getElementById('ge-live-ticker-slot');
            if (host) setTickerHost(host);
        };
        attach();
        const t1 = setTimeout(attach, 40);
        const t2 = setTimeout(attach, 200);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    useEffect(() => {
        try {
            const mobileMenu = document.getElementById('mobile-menu');
            const navLinks = document.querySelector('.lp-nav-links');
            const scrollTopBtn = document.getElementById('scrollTopBtn');
            const floatingContacts = document.getElementById('floating-contacts');
        
        // =========================================
        // NAVIGATION LOGIC
        // =========================================
        
        const drawerBackdrop = document.getElementById('lp-drawer-backdrop');
        const closeDrawerBtn = document.getElementById('close-drawer-btn');
        const moreDropdown = document.querySelector('.dropdown-content');
        const moreBtn = document.querySelector('.dropbtn');
        
        function isMobile() {
            return window.innerWidth <= 1150;
        }
        
        function closeMenu() {
            const nav = document.querySelector('.lp-nav-links') || document.getElementById('nav-links');
            const backdrop = document.getElementById('lp-drawer-backdrop');
            const menuBtn = document.getElementById('mobile-menu');
            const moreDropdown = document.querySelector('.dropdown-content');
            const moreBtn = document.querySelector('.dropbtn');
            
            if (nav) nav.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
            document.body.classList.remove('lp-drawer-open');
            if (moreDropdown) moreDropdown.classList.remove('open');
            if (moreBtn) {
                const icon = moreBtn.querySelector('i.fa-chevron-down');
                if (icon) icon.classList.remove('rotated');
            }
            if (menuBtn) {
                const icon = menuBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            }
        }

        function openMenu() {
            const nav = document.querySelector('.lp-nav-links') || document.getElementById('nav-links');
            const backdrop = document.getElementById('lp-drawer-backdrop');
            const menuBtn = document.getElementById('mobile-menu');
            
            if (nav) nav.classList.add('active');
            if (backdrop) backdrop.classList.add('active');
            document.body.classList.add('lp-drawer-open');
            if (menuBtn) {
                const icon = menuBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-times';
            }
        }

        let lastToggleTime = 0;
        function toggleMenu() {
            const now = Date.now();
            if (now - lastToggleTime < 350) return;
            lastToggleTime = now;

            const nav = document.querySelector('.lp-nav-links') || document.getElementById('nav-links');
            if (nav && nav.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        window.geToggleMobileMenu = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();
            toggleMenu();
        };

        window.geCloseMobileMenu = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();
            closeMenu();
        };

        window.geOpenMobileMenu = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();
            openMenu();
        };

        // Delegated clicks for hamburger, close button, and backdrop
        const handleGlobalNavClick = function(e) {
            const toggle = e.target.closest('#mobile-menu, .menu-toggle');
            if (toggle) {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
                return;
            }
            const closeBtn = e.target.closest('#close-drawer-btn, .drawer-close-btn');
            if (closeBtn) {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
                return;
            }
            const backdrop = e.target.closest('#lp-drawer-backdrop');
            if (backdrop) {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
                return;
            }
            // Outside drawer click on mobile
            if (isMobile()) {
                const nav = document.querySelector('.lp-nav-links') || document.getElementById('nav-links');
                if (nav && nav.classList.contains('active')) {
                    if (!nav.contains(e.target) && !e.target.closest('#mobile-menu, .menu-toggle')) {
                        closeMenu();
                    }
                }
            }
        };

        document.addEventListener('click', handleGlobalNavClick);
        
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
        document.querySelectorAll('.lp-nav-links a:not(.dropbtn)').forEach(function(anchor) {
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
            
            if (invAmount) {
                calculateReturns();
            }
        } catch (err) {
            console.warn('Landing page script warning:', err);
        }
    }, []);

    return (
        <div className="lp-root-container">
            {tickerHost && createPortal(<MarketTicker />, tickerHost)}
            <div dangerouslySetInnerHTML={{ __html: `

    <!-- Top Bar Wrapper for Sticky Scroll Effect -->
    <div id="top-bar" class="top-bar">
        <!-- Main Header -->
        <header class="main-header">
            <div class="logo-container">
                <a href="#">
                    <img src="/assest/logo.jpeg" alt="Genius Enterprises Logo">
                    <span class="company-name">Genius Enterprises</span>
                </a>
            </div>
            
            <div class="header-contact-info">
                <div class="contact-item">
                    <i class="fas fa-phone-alt"></i>
                    <a href="tel:+917317064063">+91-7317064063</a>
                </div>
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <a href="mailto:geniusenterprises189837@gmail.com?subject=Website%20Inquiry&body=Hello%20Genius%20Enterprises,%20I%20would%20like%20to%20know%20more%20about%20your%20services.">geniusenterprises189837@gmail.com</a>
                </div>
                <a href="/portal/login?tab=client" class="login-portal-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--accent-red); color: white; text-decoration: none; border-radius: 20px; font-weight: bold;"><i class="fas fa-user-lock"></i> Login Portal</a>
                <a href="https://wa.me/917317064063?text=Hello%20Genius%20Enterprises,%20I%20would%20like%20to%20know%20more%20about%20your%20services." class="whatsapp-btn" target="_blank" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            </div>

            <!-- New Image Banner that fills the entire header area on scroll -->
            <img src="/assest/bannerlogo.avif" alt="Company Banner" class="scrolled-banner-img">

        </header>

        <!-- Navigation Menu -->
        <nav class="navbar">
            <div class="menu-toggle" id="mobile-menu" role="button" tabindex="0" aria-label="Open navigation menu" onclick="window.geToggleMobileMenu && window.geToggleMobileMenu(event)"><i class="fas fa-bars"></i></div>
            
            <a href="/portal/login?tab=client" class="mobile-nav-login-btn" title="Login to Client/Employee Portal">
                <i class="fas fa-user-lock"></i>
                <span>Login</span>
            </a>

            <div class="lp-drawer-backdrop" id="lp-drawer-backdrop" onclick="window.geCloseMobileMenu && window.geCloseMobileMenu(event)"></div>

            <ul class="lp-nav-links" id="nav-links">
                <li class="drawer-header show-mobile-drawer">
                    <div class="drawer-brand">
                        <img src="/assest/logo.jpeg" alt="Genius Enterprises Logo" />
                        <div class="drawer-brand-text">
                            <strong>GENIUS</strong>
                            <small>ENTERPRISES</small>
                        </div>
                    </div>
                    <button type="button" class="drawer-close-btn" id="close-drawer-btn" aria-label="Close menu" onclick="window.geCloseMobileMenu && window.geCloseMobileMenu(event)">
                        <i class="fas fa-times"></i>
                    </button>
                </li>

                <li class="drawer-portal-actions show-mobile-drawer">
                    <div class="drawer-actions-title">Portal Access</div>
                    <div class="drawer-actions-grid">
                        <a href="/portal/login?tab=client" class="drawer-action-btn client-action">
                            <i class="fas fa-user-shield"></i>
                            <div>
                                <span class="action-label">Client Portal</span>
                                <span class="action-sub">View Portfolio & Returns</span>
                            </div>
                        </a>
                        <a href="/portal/login?tab=employee" class="drawer-action-btn employee-action">
                            <i class="fas fa-briefcase"></i>
                            <div>
                                <span class="action-label">Employee Portal</span>
                                <span class="action-sub">Staff, RM & Admin Login</span>
                            </div>
                        </a>
                    </div>
                </li>

                <li><a href="#home">Home</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#equity">Equity</a></li>
                <li><a href="#financial">Financial Planning</a></li>
                <li><a href="#mutual-funds">Mutual Funds</a></li>
                <li><a href="#insurance">Insurance</a></li>
                <li><a href="#aif">AIF</a></li>
                <li><a href="#pms">PMS</a></li>
                <li><a href="#sif">SIF</a></li>
                <!-- <li><a href="#awards">Awards</a></li> -->
                
                <li class="dropdown">
                    <a href="#" class="dropbtn">Calculators <i class="fas fa-chevron-down" style="font-size: 0.8em; margin-left: 5px;"></i></a>
                    <div class="dropdown-content">
                        <!-- Group 1: Mutual Funds -->
                        <a href="#sip-calculator">SIP Calculator</a>
                        <a href="#lumpsum-calculator">Lumpsum Calculator</a>
                        <a href="#swp-calculator">SWP (Systematic Withdrawal Plan) Calculator</a>
                        <a href="#mf-returns-calculator">Mutual Fund Returns Calculator</a>
                        <!-- Group 2: Bank Deposits -->
                        <a href="#fd-calculator">FD Calculator</a>
                        <a href="#rd-calculator">RD Calculator</a>
                        <!-- Group 3: Gov/Retirement Schemes -->
                        <a href="#ppf-calculator">PPF Calculator</a>
                        <a href="#epf-calculator">EPF Calculator</a>
                        <a href="#ssy-calculator">Sukanya Samriddhi Yojana Calculator</a>
                        <!-- Group 4: Loans -->
                        <a href="#emi-calculator">EMI Calculator</a>
                        <!-- Group 5: Taxes -->
                        <a href="#tax-calculator">Income Tax Calculator</a>
                        <a href="#gst-calculator">GST Calculator</a>
                    </div>
                </li>
                
                <li><a href="#contact">Contact</a></li>

                <li class="drawer-footer-contacts show-mobile-drawer">
                    <div class="drawer-contact-title">Direct Inquiries</div>
                    <a href="tel:+917317064063" class="drawer-contact-row"><i class="fas fa-phone-alt"></i> +91-7317064063</a>
                    <a href="mailto:geniusenterprises189837@gmail.com" class="drawer-contact-row"><i class="fas fa-envelope"></i> geniusenterprises189837@gmail.com</a>
                    <a href="https://wa.me/917317064063?text=Hello%20Genius%20Enterprises" target="_blank" class="drawer-wa-btn"><i class="fab fa-whatsapp"></i> Chat on WhatsApp</a>
                </li>
            </ul>
            <div class="social-banner">
                <a href="#"><i class="fab fa-facebook-f"></i></a>
                <a href="https://www.linkedin.com/in/siddharth-patel-108581304/"><i class="fab fa-linkedin-in"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
            </div>
        </nav>

        <div id="ge-live-ticker-slot"></div>
        <div id="ge-live-notice-slot"></div>
    </div>

    <!-- Hero Banner -->
    <section id="home" class="hero">
        <div class="hero-container">
            <div class="hero-content">
                <h1>PLAN FOR FUTURE<br><strong>FINANCIAL GOALS</strong></h1>
                <p>Your dedicated platform to manage money, invest wisely, and build long-term wealth security.</p>
                <div class="hero-buttons">
                    <a href="#about" class="btn-red">LEARN MORE</a>
                    <a href="#contact" class="btn-dark">CONTACT US</a>
                </div>
            </div>
            <div class="hero-image">
                <div class="img-overlay-icon"><i class="fas fa-award"></i></div>
                <img src="/assest/banner.jpg" alt="Financial Tax and Wealth Planning Banner">
            </div>
        </div>
    </section>

    <!-- Content Sections -->
    <section id="about" class="content-section">
        <div class="content-wrapper text-center" style="text-align: center; flex-direction: column;">
            <i class="fas fa-landmark section-icon"></i>
            <h2>About Us</h2>
            <p>At Genius Enterprises, we are more than just a wealth management platform — we are your trusted financial partners, committed to building, protecting, and growing your wealth in an ever-changing financial landscape.
                With a deep understanding of global and local financial markets, we provide tailored wealth management solutions for both individuals and corporations. Our goal is to simplify complex investment decisions and create strategic opportunities that align with your financial aspirations.
                We believe that every client’s financial journey is unique. That’s why we take a personalized approach, combining expert market insights, risk assessment, and innovative financial strategies to design solutions that match your goals, whether it’s wealth preservation, portfolio diversification, retirement planning, or business financial growth.
                At the core of our services is a strong commitment to transparency, trust, and long-term value creation. We focus on safeguarding your assets while identifying sustainable growth opportunities that can withstand market fluctuations and economic uncertainty.
                Our team of experienced financial professionals works tirelessly to stay ahead of market trends, ensuring our clients benefit from informed decision-making and proactive wealth strategies. By leveraging data-driven analysis and strategic planning, we help our clients achieve financial stability, maximize returns, and secure a prosperous future.
                At Genius Enterprises, your success is our priority. We are dedicated to empowering you with the knowledge, strategies, and confidence needed to achieve lasting financial security and unlock your full wealth potential.</p>
        </div>
    </section>

    <section id="equity" class="content-section">
        <div class="content-wrapper">
            <div class="content-text">
                <i class="fas fa-chart-line section-icon"></i>
                <h2>Equity Investments</h2>
                <p>Unlock the potential of wealth creation by participating directly in the growth of high-performing companies through our expert equity investment solutions. At Genius Enterprises, we provide strategic guidance and seamless execution to help you capitalize on market opportunities with confidence.
                    Our equity investment services are designed to align with your financial goals, risk tolerance, and investment horizon. Through detailed market research, disciplined analysis, and proactive portfolio management, we help you make informed decisions in dynamic market conditions.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> In-depth fundamental and technical stock analysis</li>
                    <li><i class="fas fa-check-circle"></i> Customized stock portfolios tailored to your risk appetite</li>
                    <li><i class="fas fa-check-circle"></i> Real-time market tracking and portfolio rebalancing advice</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-chart-line"></i></div>
                <img src="/assest/2.avif" alt="Equity Market Graph">
            </div>
        </div>
    </section>

    <section id="financial" class="content-section">
        <div class="content-wrapper reverse">
            <div class="content-text">
                <i class="fas fa-bullseye section-icon"></i>
                <h2>Financial Planning</h2>
                <p>Build a strong financial foundation and achieve your life’s most important milestones with our comprehensive goal-based financial planning solutions. At Genius Enterprises, we help bring structure, clarity, and confidence to your financial journey by creating personalized plans tailored to your aspirations and future needs.
                    Whether you are preparing for retirement, planning for your child’s future, or managing your day-to-day finances, our strategic approach ensures every step is aligned with your long-term objectives. We focus on balancing growth, protection, and stability to help you make smarter financial decisions.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> Retirement planning to secure a comfortable and stress-free future</li>
                    <li><i class="fas fa-check-circle"></i> Child education and marriage planning for life’s major milestones</li>
                    <li><i class="fas fa-check-circle"></i> Advanced and legal tax-saving strategies to optimize your earnings</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-bullseye"></i></div>
                <img src="/assest/2.jpg" alt="Financial Planning">
            </div>
        </div>
    </section>

    <section id="mutual-funds" class="content-section">
        <div class="content-wrapper">
            <div class="content-text">
                <i class="fas fa-coins section-icon"></i>
                <h2>Mutual Funds</h2>
                <p>Build wealth systematically and achieve your financial goals with our carefully curated mutual fund investment solutions. At Genius Enterprises, we simplify investing by offering access to a wide range of professionally managed mutual funds designed to deliver diversification, stability, and long-term growth.
                    Whether you are a beginner looking to start small or an experienced investor seeking balanced portfolio expansion, our mutual fund strategies are tailored to your risk profile and financial objectives. With expert guidance and ongoing support, we help you make informed investment decisions for a stronger financial future.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> Easy setup for Systematic Investment Plans (SIPs)</li>
                    <li><i class="fas fa-check-circle"></i> Access to Equity, Debt, and Hybrid fund categories</li>
                    <li><i class="fas fa-check-circle"></i> Tax-saving ELSS funds for optimal returns</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-coins"></i></div>
                <img src="/assest/3.jpg" alt="Mutual Funds Growth">
            </div>
        </div>
    </section>

    <section id="insurance" class="content-section">
        <div class="content-wrapper reverse">
            <div class="content-text">
                <i class="fas fa-shield-alt section-icon"></i>
                <h2>Insurance Support</h2>
                <p>Secure your future and protect what matters most with our comprehensive insurance planning solutions. At Genius Enterprises, we help you build a strong financial safety net to safeguard your family, health, and valuable assets against life’s uncertainties.
                    Our insurance support services are designed to provide complete protection, ensuring financial stability during unexpected events while giving you peace of mind. From personal coverage to corporate risk protection, we create tailored insurance strategies that align with your unique needs and long-term goals.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> Comprehensive Term Life Insurance planning</li>
                    <li><i class="fas fa-check-circle"></i> Tailored Health and Critical Illness coverage</li>
                    <li><i class="fas fa-check-circle"></i> Protection for corporate assets and liabilities</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-shield-alt"></i></div>
                <img src="/assest/4.jpg" alt="Insurance Shield Concept">
            </div>
        </div>
    </section>

    <section id="aif" class="content-section">
        <div class="content-wrapper">
            <div class="content-text">
                <i class="fas fa-building section-icon"></i>
                <h2>Alternative Investment Funds (AIF)</h2>
                <p>Explore exclusive investment avenues beyond conventional markets with our specialized Alternative Investment Fund solutions. At Genius Enterprises, we provide High Net Worth Individuals (HNIs) access to premium opportunities designed to diversify wealth, enhance returns, and capitalize on emerging sectors.
                    Our AIF strategies are crafted for sophisticated investors seeking higher growth potential through carefully selected alternative asset classes. With expert market insights and strategic portfolio structuring, we help you unlock opportunities that are often inaccessible through traditional investment channels.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> Access to Private Equity and Venture Capital</li>
                    <li><i class="fas fa-check-circle"></i> Investments in Real Estate and Hedge Funds</li>
                    <li><i class="fas fa-check-circle"></i> Strategies designed for sophisticated investors</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-building"></i></div>
                <img src="/assest/6.avif" alt="Corporate Buildings AIF">
            </div>
        </div>
    </section>

    <section id="pms" class="content-section">
        <div class="content-wrapper reverse">
            <div class="content-text">
                <i class="fas fa-briefcase section-icon"></i>
                <h2>Portfolio Management Services (PMS)</h2>
                <p>Experience personalized wealth management with our exclusive Portfolio Management Services, designed for investors seeking a dedicated and strategic approach to growing their wealth. At Genius Enterprises, we provide customized investment solutions managed by experienced professionals who align every decision with your financial goals.
                    Our PMS offerings focus on creating high-conviction portfolios with a disciplined investment approach, combining deep market research, active monitoring, and strategic asset allocation. This ensures your portfolio remains optimized for both growth opportunities and risk management.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> High-conviction, concentrated stock portfolios</li>
                    <li><i class="fas fa-check-circle"></i> Transparent fee structures and direct stock ownership</li>
                    <li><i class="fas fa-check-circle"></i> Active risk management and tactical asset allocation</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-briefcase"></i></div>
                <img src="/assest/5.avif" alt="Portfolio Management Meeting">
            </div>
        </div>
    </section>

    <section id="sif" class="content-section">
        <div class="content-wrapper">
            <div class="content-text">
                <i class="fas fa-gem section-icon"></i>
                <h2>Specialized Investment Funds (SIF)</h2>
                <p>Gain access to focused investment opportunities designed to capture niche market trends, emerging industries, and global megatrends. At Genius Enterprises, our Specialized Investment Funds are tailored for investors looking to diversify beyond traditional asset classes and tap into high-potential sectors.
                    Our SIF solutions are built around carefully selected themes and innovative strategies that align with evolving market dynamics. By combining deep sector expertise with strategic portfolio construction, we help investors capitalize on opportunities that can deliver long-term value and competitive returns.</p>
                <ul class="feature-list">
                    <li><i class="fas fa-check-circle"></i> Thematic investments (e.g., Tech, ESG, Healthcare)</li>
                    <li><i class="fas fa-check-circle"></i> Structured products with defined risk-reward profiles</li>
                    <li><i class="fas fa-check-circle"></i> Global asset diversification avenues</li>
                </ul>
            </div>
            <div class="content-image">
                <div class="img-overlay-icon"><i class="fas fa-gem"></i></div>
                <img src="/assest/9.avif" alt="Data Analytics SIF">
            </div>
        </div>
    </section>

    <!-- Awards Section (Commented out for future use)
    <section id="awards" class="content-section">
        <div class="content-wrapper text-center" style="text-align: center; flex-direction: column;">
            <i class="fas fa-trophy section-icon"></i>
            <h2>Awards & Recognition</h2>
            <p>We are honored to be recognized by the industry for our dedication, innovation, and commitment to excellence in wealth management.</p>
            
            <div class="awards-gallery">
                <img src="/assest/9.avif" alt="Industry Award 1">
                <img src="/assest/banner (2).jpg" alt="Industry Award 2">
                <img src="/assest/banner.jpg" alt="Industry Award 3">
            </div>
        </div>
    </section>
    -->

    <!-- CALCULATORS SECTION -->
    <section id="calculators" class="content-section" style="background-color: var(--bg-light); position: relative;">
        <!-- Hidden Anchors to catch Dropdown clicks without obscuring the header -->
        <div id="sip-calculator" style="position: absolute; top: -100px;"></div>
        <div id="lumpsum-calculator" style="position: absolute; top: -100px;"></div>
        <div id="swp-calculator" style="position: absolute; top: -100px;"></div>
        <div id="mf-returns-calculator" style="position: absolute; top: -100px;"></div>
        <div id="fd-calculator" style="position: absolute; top: -100px;"></div>
        <div id="rd-calculator" style="position: absolute; top: -100px;"></div>
        <div id="ppf-calculator" style="position: absolute; top: -100px;"></div>
        <div id="epf-calculator" style="position: absolute; top: -100px;"></div>
        <div id="ssy-calculator" style="position: absolute; top: -100px;"></div>
        <div id="emi-calculator" style="position: absolute; top: -100px;"></div>
        <div id="tax-calculator" style="position: absolute; top: -100px;"></div>
        <div id="gst-calculator" style="position: absolute; top: -100px;"></div>
        
        <div class="content-wrapper text-center" style="flex-direction: column; max-width: 1000px;">
            <i class="fas fa-calculator section-icon"></i>
            <h2>Investment & Tax Calculators</h2>
            <p>Estimate execution vectors for returns or calculate real-time tax processing vectors instantly.</p>

            <div class="calc-toggle">
                <!-- Systematically Ordered Tabs -->
                <button class="calc-tab active" data-type="sip">SIP</button>
                <button class="calc-tab" data-type="lumpsum">Lumpsum</button>
                <button class="calc-tab" data-type="swp">SWP</button>
                <button class="calc-tab" data-type="mf">MF Returns</button>
                <button class="calc-tab" data-type="fd">FD</button>
                <button class="calc-tab" data-type="rd">RD</button>
                <button class="calc-tab" data-type="ppf">PPF</button>
                <button class="calc-tab" data-type="epf">EPF</button>
                <button class="calc-tab" data-type="ssy">SSY</button>
                <button class="calc-tab" data-type="emi">EMI</button>
                <button class="calc-tab" data-type="tax">Income Tax</button>
                <button class="calc-tab" data-type="gst">GST</button>
            </div>

            <div class="calculator-container">
                <div class="calc-inputs">
                    <div class="input-group">
                        <label id="calc-amount-label">Monthly Investment (₹)</label>
                        <input type="number" id="invAmount" value="5000">
                        <input type="range" id="invAmountSlider" min="500" max="100000" step="500" value="5000" class="calc-slider">
                    </div>

                    <!-- Exclusive SWP Input -->
                    <div class="input-group" id="swp-withdrawal-group" style="display: none;">
                        <label>Withdrawal per month (₹)</label>
                        <input type="number" id="swpWithdrawal" value="10000">
                        <input type="range" id="swpWithdrawalSlider" min="500" max="100000" step="500" value="10000" class="calc-slider">
                    </div>

                    <!-- Exclusive SSY Inputs -->
                    <div class="input-group" id="ssy-age-group" style="display: none;">
                        <label>Girl Child's Age (Years)</label>
                        <input type="number" id="ssyAge" value="1" min="0" max="10">
                        <input type="range" id="ssyAgeSlider" min="0" max="10" step="1" value="1" class="calc-slider">
                    </div>
                    <div class="input-group" id="ssy-year-group" style="display: none;">
                        <label>Investment Starting Year</label>
                        <input type="number" id="ssyYear" value="2026" min="2015" max="2050">
                    </div>

                    <!-- Exclusive EPF Inputs -->
                    <div class="input-group" id="epf-age-group" style="display: none;">
                        <label>Current Age (Years)</label>
                        <input type="number" id="epfAge" value="25" min="15" max="58">
                        <input type="range" id="epfAgeSlider" min="15" max="58" step="1" value="25" class="calc-slider">
                    </div>

                    <!-- Exclusive Income Tax Input -->
                    <div class="input-group" id="tax-other-income-group" style="display: none;">
                        <label>Income from Other Sources (₹)</label>
                        <input type="number" id="taxOtherIncome" value="35000">
                        <input type="range" id="taxOtherIncomeSlider" min="0" max="1000000" step="5000" value="35000" class="calc-slider">
                    </div>

                    <!-- Exclusive GST Inputs -->
                    <div class="input-group" id="gst-type-group" style="display: none;">
                        <label>GST Treatment</label>
                        <select id="gstType" class="calc-select">
                            <option value="add">GST Exclusive (Add GST)</option>
                            <option value="remove">GST Inclusive (Remove GST)</option>
                        </select>
                    </div>

                    <!-- Exclusive FD Frequency Input -->
                    <div class="input-group" id="fd-freq-group" style="display: none;">
                        <label>Compounding Frequency</label>
                        <select id="fdFreq" class="calc-select">
                            <option value="1">Yearly</option>
                            <option value="2">Half-Yearly</option>
                            <option value="4" selected>Quarterly</option>
                            <option value="12">Monthly</option>
                        </select>
                    </div>

                    <!-- Standard Rate & Time Inputs -->
                    <div class="input-group" id="inv-rate-group">
                        <label id="calc-rate-label">Expected Return Rate (p.a %)</label>
                        <input type="number" id="invRate" value="12">
                        <input type="range" id="invRateSlider" min="1" max="30" step="0.5" value="12" class="calc-slider">
                    </div>
                    <div class="input-group" id="inv-years-group">
                        <label id="calc-years-label">Time Period (Years)</label>
                        <input type="number" id="invYears" value="10">
                        <input type="range" id="invYearsSlider" min="1" max="40" step="1" value="10" class="calc-slider">
                    </div>
                </div>
                
                <div class="calc-results">
                    <div class="result-row">
                        <span id="res-label-1">Invested Amount</span>
                        <h3 id="totalInvestment">₹ 6,00,000</h3>
                    </div>
                    <div class="result-row">
                        <span id="res-label-2">Est. Returns</span>
                        <h3 id="estReturns">₹ 5,61,695</h3>
                    </div>
                    <div class="result-total">
                        <span id="res-label-3">Total Expected Value</span>
                        <h2 id="totalValue">₹ 11,61,695</h2>
                    </div>
                </div>
            </div>

            <!-- Informational Content Panels -->
            
            <div id="sip-info" class="calculator-info">
                <h3>SIP Calculator – Systematic Investment Plan Calculator</h3>
                <p>Prospective investors often think that SIPs and mutual funds are the same. However, SIPs are merely a method of investing in mutual funds, the other method being a lump sum. A SIP calculator is a tool that helps you determine the returns you can avail when parking your funds in such investment tools. A Systematic Investment Plan, or SIP, is a process of investing a fixed sum of money in mutual funds at regular intervals. SIPs usually allow you to invest weekly, quarterly, or monthly.</p>
                <h4>What is a SIP Calculator?</h4>
                <p>A SIP calculator is a simple tool that allows individuals to get an idea of the returns on their mutual fund investments made through SIP. SIP investments in mutual funds have become one of the most popular investment options for millennials lately.</p>
                <p>These mutual fund SIP calculators are designed to give potential investors an estimate on their mutual fund investments. However, the actual returns offered by a mutual fund scheme vary depending on various factors. The SIP calculator does not provide clarification for the exit load and expense ratio (if any).</p>
                <p>This calculator will calculate the wealth gain and expected returns for your monthly SIP investment. Indeed, you get a rough estimate on the maturity amount for any of your monthly SIPs, based on a projected annual return rate.</p>
                <h4>How can a SIP return calculator help you?</h4>
                <p>SIPs are a more lucrative mode of investing funds compared to a lump sum amount according to several mutual fund experts. It helps you become financially disciplined and create a habit of savings that can benefit you in the future.</p>
                <p>A SIP calculator online is a beneficial tool, which shows the estimated returns you will earn after the investment tenure. A few of the benefits of SIP calculators include:</p>
                <ul>
                    <li>Assists you in determining the amount you want to invest.</li>
                    <li>Tells you the total amount you have invested.</li>
                    <li>Gives an estimated value of the returns.</li>
                </ul>
                <h4>How do SIP calculators work?</h4>
                <p>A SIP plan calculator works on the following formula:</p>
                <div class="formula-box">M = P × ({[1 + i]<sup>n</sup> – 1} / i) × (1 + i)</div>
                <p>In the above formula:</p>
                <ul>
                    <li><strong>M</strong> is the amount you receive upon maturity.</li>
                    <li><strong>P</strong> is the amount you invest at regular intervals.</li>
                    <li><strong>n</strong> is the number of payments you have made.</li>
                    <li><strong>i</strong> is the periodic rate of interest.</li>
                </ul>
                <p>Take for example you want to invest Rs. 1,000 per month for 12 months at a periodic rate of interest of 12%. Now, to calculate the SIP maturity amount, we need the monthly rate of return (i).</p>
                <p>A common mistake is to simply divide the annual return by 12. For example, taking a 12% annual return as 12 ÷ 12 = 1% per month is not correct because returns are compounded.</p>
                <p>The right way is to convert the annual return into a monthly return by using the following formula:</p>
                <div class="formula-box">Monthly Return = {(1 + Annual Return)<sup>1/12</sup>} – 1</div>
                <p>So, for an annual return of 12%, the effective monthly return comes to about 0.95%, not 1%.</p>
                <p>This is because if you compound 0.95% for 12 months, it gives back 12% annually. But if you assume 1% monthly, the compounded annual return becomes more than 12%, thus giving an inflated result.</p>
                <p>Hence, using the above formula, the monthly rate of return will be:</p>
                <div class="formula-box">i = (1 + 0.12)<sup>1/12</sup> − 1 = 0.0095 or 0.95%</div>
                <p>Therefore,</p>
                <div class="formula-box">M = 1,000 × ({[1 + 0.0095]<sup>12</sup> – 1} / 0.0095) × (1 + 0.0095)</div>
                <p>which gives ₹12,766 approximately in a year.</p>
                <p>Please note that the rate of interest on a SIP will differ as per market conditions. It may increase or decrease, which will change the estimated returns.</p>
                <h4>How to use Genius's systematic investment plan calculator?</h4>
                <p>You can use the SIP amount calculator from Genius within a few clicks. Just enter the monthly invested amount (the amount for which you have started the SIP), the number of years for which you want to stay invested, and the expected rate of return.</p>
                <p>As soon as you input the values, the calculator will show you the estimated amount you can avail after your investment tenure is complete.</p>
                <h4>Advantages of using the Genius systematic investment plan calculator</h4>
                <p>Genius offers the best SIP calculator, providing the following advantages:</p>
                <ul>
                    <li>Plan your investment based on the amount and tenure.</li>
                    <li>It helps you compute an estimation of the total value of investments at the end of your SIP tenure.</li>
                    <li>Shows accurate results and helps you save time required during a manual calculation.</li>
                </ul>
                <p>A systematic investment plan calculator ensures that your savings portfolio is as per your requirements and financial needs.</p>
            </div>

            <div id="lumpsum-info" class="calculator-info" style="display: none;">
                <h3>Lumpsum Calculator – Mutual Fund Return Estimator</h3>
                <p>Investments in mutual funds can be broadly classified into two types: lumpsum and SIP. A lumpsum investment is when the depositor invests a significant sum of money in a particular mutual fund scheme. SIP or Systematic Investment Plan, on the other hand, entails the investment of smaller amounts on a monthly basis.</p>
                <p>Both of these types of mutual fund investment strategies have their fair share of benefits. Lumpsum investments are particularly preferred by a majority of investors, as there are fewer variables involved and returns are generally on the higher side. To find out the estimated returns on your lumpsum mutual fund investment, you may use a mutual fund lumpsum calculator available online.</p>
                <h4>How can a Lumpsum Calculator Help You?</h4>
                <p>Mutual fund investors can use this calculator to figure out the estimated returns on their investments. Before getting into the benefits of using this calculator, one must know the types of returns for a lumpsum investment.</p>
                <ul>
                    <li>Absolute return</li>
                    <li>Total return</li>
                    <li>Annualised return</li>
                    <li>Point to point return</li>
                    <li>Trailing return</li>
                    <li>Rolling return</li>
                </ul>
                <p>It’s paramount that an investor understands all these types of returns in detail to avail the maximum benefits from their mutual fund investments.</p>
                <p>Now that you are familiar with the type of returns, it’s time to delve into the benefits of using a lumpsum return calculator:</p>
                <ul>
                    <li>This calculator provides you with the estimated returns for the whole investment period. You may calculate your investments’ 1-year, 3-year, and 5-year returns using this calculator.</li>
                    <li>It’s incredibly convenient and easy to use. Even a layperson can use this calculator with relative ease.</li>
                    <li>It offers a reasonably accurate estimate. Note that mutual fund investments are subject to market risks, and cannot be predicted with pinpoint accuracy.</li>
                    <li>Enables an investor to plan his/her finances better based on the estimated return they are most likely to receive at the end of their investment period.</li>
                </ul>
                <h4>Formula to Calculate MF returns</h4>
                <p>All lumpsum mutual fund calculators use a specific method to compute the estimated return on investment. It is essentially a compound interest formula with one of the variables being the number of times the interest is compounded in a year.</p>
                <p>The formula is as follows:</p>
                <div class="formula-box">A = P (1 + r/n) <sup>nt</sup></div>
                <p>The variables are mentioned in the table below:</p>
                <ul>
                    <li><strong>A:</strong> Estimated return</li>
                    <li><strong>P:</strong> Present value</li>
                    <li><strong>r:</strong> Rate of return</li>
                    <li><strong>t:</strong> Duration of investment</li>
                    <li><strong>n:</strong> Number of compounded interests in a year</li>
                </ul>
                <p>You can use this formula to compute your mutual fund returns accurately. For example, imagine investing Rs. 15 Lakh in a fund with a 12% return for a 5-year period compounding every 6 months.</p>
                <p>The estimated return in this scenario will be:</p>
                <div class="formula-box">A = Rs. 15,00,000 (1 + 12%) <sup>5</sup></div>
                <p>As you can surmise, it’s a complex equation which may be out of grasp for a majority of investors. A lumpsum MF calculator will calculate it instantly. In this case, your estimated return at the end of a 5-year period shall be Rs. 26,43,513.</p>
                <h4>How to use the Genius lumpsum calculator?</h4>
                <p>The lumpsum calculator available on the Genius website is easily navigable. Follow the steps mentioned below to calculate your ROI on mutual funds:</p>
                <ul>
                    <li>Provide required variables at their designated slots. You may also use the slider to adjust values.</li>
                    <li>The calculator will provide you with an estimated value in seconds.</li>
                </ul>
                <h4>Advantages of using the Genius lumpsum calculator</h4>
                <p>A mutual fund lumpsum calculator is an incredibly convenient financial tool which comes with a host of benefits.</p>
                <ul>
                    <li>Returns on mutual fund investments cannot be calculated accurately as they are subjected to market risks. A calculator provides you with the closest possible estimate.</li>
                    <li>It enables you to plan your finances based on the estimated returns.</li>
                    <li>It is an online tool, implying that you can use it at any time from any place. It eliminates time and space constraints.</li>
                    <li>It saves your time and effort, as these calculations can take several minutes. Doing calculations manually for more than one variation can take hours.</li>
                </ul>
                <p>Lumpsum investments are one of the most widely availed investment vehicles, most of which have a time-proven history of yielding high returns. You may begin your investment with a smaller amount and increase it as you become more comfortable with the procedure.</p>
            </div>

            <div id="swp-info" class="calculator-info" style="display: none;">
                <h3>SWP (Systematic Withdrawal Plan): Meaning, Benefits & How to Start in Mutual Funds</h3>
                <h4>Key Takeaways</h4>
                <ul>
                    <li>A Systematic Withdrawal Plan (SWP) allows investors to withdraw money from mutual funds at regular intervals.</li>
                    <li>Units are redeemed at the prevailing NAV, and the proceeds are credited to the investor's bank account.</li>
                    <li>The remaining corpus stays invested and continues to participate in market movements.</li>
                    <li>Investors can choose a fixed withdrawal amount and, where available, may opt to withdraw only the capital appreciation generated by the investment.</li>
                    <li>SWP withdrawals are not subject to TDS, and capital gains tax applies only to the gains portion of each redemption.</li>
                    <li>SWPs are commonly used to generate regular income, especially during retirement.</li>
                    <li>If withdrawals consistently exceed investment returns, the corpus may gradually deplete over time.</li>
                </ul>
                <p>Mutual funds can serve different investment objectives. While some investors use them to build long-term wealth, others rely on them to generate a regular stream of income from their accumulated corpus. To address these varying requirements, mutual fund houses offer a range of facilities that help investors invest and withdraw money in a structured manner.</p>
                <p>One such facility is a Systematic Withdrawal Plan (SWP). In this article, we explain what an SWP is, how it works, its benefits, risks, and the factors investors should consider before opting for it.</p>
                <h4>What is a Systematic Withdrawal Plan (SWP)?</h4>
                <p>A Systematic Withdrawal Plan (SWP) is a facility offered by mutual funds that allows investors to withdraw a predetermined amount from their investment at regular intervals. Instead of redeeming the entire investment at once, investors can receive periodic payouts while the remaining corpus continues to stay invested in the scheme.</p>
                <p>Under an SWP, investors can decide the withdrawal amount and frequency based on their financial needs. Withdrawals can be scheduled monthly, quarterly, half-yearly, or annually. On each withdrawal date, the mutual fund redeems the required number of units at the prevailing Net Asset Value (NAV) and credits the proceeds to the investor's registered bank account.</p>
                <p>For example, if an investor puts ₹5 lakh into a mutual fund and opts for a monthly SWP of ₹10,000, the fund will redeem units worth ₹10,000 every month and transfer the amount to the investor's bank account. The remaining investment stays in the fund and continues to participate in market movements.</p>
                <h4>Key Features of SWP</h4>
                <ul>
                    <li>Enables systematic withdrawal from mutual fund investments.</li>
                    <li>Allows investors to choose the withdrawal amount and frequency.</li>
                    <li>Units are redeemed at the prevailing NAV on each withdrawal date.</li>
                    <li>The remaining corpus remains invested in the scheme.</li>
                    <li>Can be used to generate regular cash flow from an existing investment.</li>
                    <li>Offers the flexibility to modify or discontinue withdrawals, subject to the fund house's terms and conditions.</li>
                </ul>
                <h4>Types of Systematic Withdrawal Plan (SWP)</h4>
                <ul>
                    <li><strong>Fixed Amount SWP:</strong> Under this option, a predetermined amount is withdrawn at regular intervals. Since the withdrawal amount remains constant, the number of units redeemed varies depending on the scheme's NAV on the withdrawal date.</li>
                    <li><strong>Appreciation SWP:</strong> Under this option, only the gains generated by the investment are withdrawn, while the original invested amount or the principal remains invested. The withdrawal amount may vary depending on the scheme's gains and prevailing market conditions.</li>
                </ul>
                <h4>How to Start an SWP</h4>
                <ul>
                    <li><strong>Step 1:</strong> Ensure you have an existing mutual fund investment with a sufficient corpus to support your withdrawal plans.</li>
                    <li><strong>Step 2:</strong> Log in to your mutual fund account, AMC website, or an investment platform such as Genius.</li>
                    <li><strong>Step 3:</strong> Select the specific fund folio from which you want to set up withdrawals.</li>
                    <li><strong>Step 4:</strong> Choose the SWP option and enter your withdrawal amount, frequency, and start date. You can also set an end date or total number of instalments.</li>
                    <li><strong>Step 5:</strong> Confirm the instruction. The fund house will automatically redeem units and credit proceeds to your registered bank account on each scheduled date.</li>
                    <li><strong>Step 6:</strong> Review annually and adjust if your financial needs or market conditions change.</li>
                </ul>
                <h4>Plan Your Withdrawals with the Genius SWP Calculator</h4>
                <p>Before committing to a withdrawal amount, it is important to understand how different withdrawal rates affect your corpus over time. The Genius SWP Calculator lets you enter your investment amount, expected return rate, monthly withdrawal amount, and tenure to instantly see your projected corpus value at the end of the period.</p>
                <p>By adjusting the withdrawal amount or return assumption in the calculator, investors can identify a sustainable withdrawal level before setting up the SWP. Use the Genius SWP Calculator to model your own numbers across different scenarios.</p>
                <h4>Benefits of a Systematic Withdrawal Plan (SWP)</h4>
                <p>Investors seeking regular income from their mutual fund investments generally have two options: the Income Distribution cum Capital Withdrawal (IDCW), formerly known as the Dividend option, or a Systematic Withdrawal Plan (SWP).</p>
                <p>Under the IDCW option, distributions are generally taxable in investors' hands at their applicable income tax rates. In addition, a 10% TDS may apply if IDCW receipts from a fund house exceed the prescribed threshold.</p>
                <p>In contrast, SWP withdrawals are not subject to TDS. Since an SWP involves redeeming mutual fund units, capital gains tax applies only to the gains component of each redemption rather than the entire withdrawal amount.</p>
                <p>The tax treatment of SWP withdrawals depends on the type of mutual fund and the holding period of the investment, as shown below:</p>
                <table class="info-table">
                    <tr>
                        <th>Fund Type</th>
                        <th>Short-Term Capital Gains (STCG)</th>
                        <th>Long-Term Capital Gains (LTCG)</th>
                    </tr>
                    <tr>
                        <td>Equity Mutual Funds</td>
                        <td>20%</td>
                        <td>12.5% on gains above ₹1.25 lakh per financial year (holding period over 12 months)</td>
                    </tr>
                    <tr>
                        <td>Equity-oriented Balanced Mutual Funds</td>
                        <td>20%</td>
                        <td>12.5% on gains above ₹1.25 lakh per financial year</td>
                    </tr>
                    <tr>
                        <td>Debt Mutual Funds (purchased after April 1, 2023)</td>
                        <td>Taxed at the applicable income tax slab rate</td>
                        <td>As per the applicable income tax slab</td>
                    </tr>
                </table>
                <p><em>Note: Tax rules are subject to change. Investors should consult a tax advisor or financial professional for advice based on their individual circumstances.</em></p>
                <p>Since the capital gains tax under SWP applies only to the profit component of each redemption (not the full withdrawal amount), SWP may offer better tax efficiency than IDCW for many investors.</p>
                <p>Redeeming an entire mutual fund investment at once can expose investors to market-timing risk. If markets are down on the redemption date, the value realised may be lower than expected.</p>
                <p>An SWP helps reduce this risk by spreading withdrawals across multiple dates. When the NAV is high, fewer units are redeemed for the same withdrawal amount, and when the NAV is low, more units are redeemed.</p>
                <p>Here is an example: Suppose you have invested ₹6 lakh in a mutual fund and set up an SWP of ₹50,000 per month. Here is how the number of units redeemed varies as the NAV fluctuates each month:</p>
                <table class="info-table">
                    <tr>
                        <th>Month</th>
                        <th>NAV</th>
                        <th>Withdrawal (₹)</th>
                        <th>Units Redeemed</th>
                    </tr>
                    <tr>
                        <td>January</td>
                        <td>₹100</td>
                        <td>₹50,000</td>
                        <td>500</td>
                    </tr>
                    <tr>
                        <td>February</td>
                        <td>₹80</td>
                        <td>₹50,000</td>
                        <td>625</td>
                    </tr>
                    <tr>
                        <td>March</td>
                        <td>₹120</td>
                        <td>₹50,000</td>
                        <td>417</td>
                    </tr>
                    <tr>
                        <td>April</td>
                        <td>₹90</td>
                        <td>₹50,000</td>
                        <td>556</td>
                    </tr>
                    <tr>
                        <td>May</td>
                        <td>₹110</td>
                        <td>₹50,000</td>
                        <td>455</td>
                    </tr>
                </table>
                <p>Total withdrawn: ₹2,50,000 <br>Total units redeemed: 2,553</p>
                <p>Average NAV across these months: ₹100. But your average redemption price works out to ₹2,50,000 ÷ 2,553 = ₹97.9 per unit, illustrating how SWP spreads redemptions across different NAV levels instead of relying on a single exit point. This is rupee cost averaging in action.</p>
                <p><em>Note: Rupee cost averaging does not protect investors from losses. In a sustained downturn, more units are redeemed at depressed prices, which can accelerate corpus depletion. It may help moderate short-term volatility, but it does not shield investors from a prolonged bear market.</em></p>
                <p>If the annual withdrawal amount is lower than the scheme's returns, the corpus may support withdrawals for a longer period, and investors can realise a portion of those gains through systematic withdrawals. However, mutual fund returns are market-linked and not guaranteed. The corpus can deplete more quickly during extended bear phases if withdrawals outpace returns.</p>
                <p>Just as a Systematic Investment Plan (SIP) helps you adopt a disciplined approach to investing, an SWP helps you steer clear of panic-driven, large-scale redemptions during market corrections. By committing to a scheduled withdrawal plan, investors can keep redemptions more structured and predictable.</p>
                <p>SWP provides a predictable income stream delivered directly to your bank account at regular intervals. This makes it particularly valuable for retirees managing monthly living expenses or anyone who needs to fund recurring obligations without having to manually initiate redemptions each time.</p>
                <p>Investors can generally modify, pause, or discontinue SWP instructions in most open-ended mutual funds, subject to the AMC's operational processes and applicable notice periods. Investors can also switch between withdrawing a fixed amount and withdrawing only capital appreciation based on their financial needs.</p>
                <h4>Risks of SWP</h4>
                <p>While an SWP can provide regular cash flow, investors should be aware of the following risks:</p>
                <ul>
                    <li>Since mutual funds are market-linked investments, the value of the remaining corpus can fluctuate significantly during market volatility.</li>
                    <li>A market downturn in the initial years of an SWP can significantly impact the corpus. Investors may have to redeem more units at lower NAVs to maintain withdrawals, reducing the portfolio's ability to recover when markets rebound.</li>
                    <li>If the withdrawal amount consistently exceeds the returns generated by the fund, the investment corpus may deplete faster than anticipated.</li>
                    <li>If the mutual fund delivers lower-than-expected returns over an extended period, the corpus may not sustain withdrawals for as long as planned.</li>
                    <li>The purchasing power of a fixed withdrawal amount may decline over time due to inflation. Investors may need to periodically review and adjust their withdrawal strategy to keep pace with rising expenses.</li>
                </ul>
                <h4>Effective Uses of SWP</h4>
                <p>Investors can use an SWP to create a steady cash flow from an existing mutual fund investment, without redeeming their entire investment.</p>
                <ul>
                    <li>Regardless of whether you have a formal pension plan, you can build a retirement corpus over your earning years and invest it in a mutual fund scheme suited to your risk profile. Once you retire, you can activate an SWP to receive regular monthly payouts.</li>
                    <li>Investors seeking relatively lower volatility may consider using SWPs from conservative fund categories such as arbitrage funds or short-duration debt funds. However, no mutual fund can guarantee capital preservation, and withdrawals that exceed returns can gradually reduce the corpus.</li>
                </ul>
                <p>It is important to note that SWP withdrawals are funded through the redemption of mutual fund units. If withdrawals consistently exceed the returns generated by the investment, the corpus may gradually reduce over time. Therefore, an SWP should not be viewed as a guaranteed or risk-free source of income.</p>
            </div>

            <div id="mf-info" class="calculator-info" style="display: none;">
                <h3>Mutual Fund Returns Calculator</h3>
                <p>Mutual funds are one of the most popular avenues of investment in the Indian context. As of June 2019, the average assets under management (AuM) of the entire MF industry stands at a staggering Rs. 24.25 trillion, an over four-fold increase from Rs. 5.83 trillion in 2009.</p>
                <p>Though mutual fund investments are subject to market risks, the returns can be estimated reasonably accurately. You can use the free mutual fund return calculator from Genius to arrive at the amount of the expected returns.</p>
                <h4>How Can a Mutual Fund Return Calculator Online Help You?</h4>
                <p>There are various types of mutual fund returns that an investor should be familiar with. They are absolute return, annualised return, total return, trailing return, point to point return, and rolling return.</p>
                <p>It can be somewhat confusing for a prospective investor to keep so many factors in mind, which is where the mutual fund return calculator online can be immensely helpful.</p>
                <ul>
                    <li>It will provide you with the full estimate for 1 year, 3 year and 5 year investment periods.</li>
                    <li>It enables you to do future financial planning based on the estimated returns.</li>
                    <li>You don’t need to be a subject expert to be able to use this calculator. It’s simple to use, and even someone who hasn’t used it before will not find it challenging to navigate.</li>
                </ul>
                <h4>How does a Mutual Fund Total Return Calculator Work?</h4>
                <p>A mutual fund calculator is a practical financial tool that enables an investor to calculate the returns yielded by investing in mutual funds. In broad terms, there are two ways in which one can invest in mutual funds – one time & monthly.</p>
                <p>SIP or Systematic Investment Plan is an avenue of investing in mutual funds. In a SIP, an individual invests a small amount every month on designated schemes. One thing to remember is that the NAV of such funds changes every month and the same amount of money can purchase a variable number of units in different months.</p>
                <p>Imagine that you invest via SIP of Rs. 1000 for 12 months. At the time of availing the SIP, the NAV of your chosen stock is Rs. 10. So, you can purchase 100 units of the stock in the first month. In the second month, the NAV increases to Rs. 20. Your 1000 rupees can now buy just 50 units of the same stock.</p>
                <p>An online SIP calculator predicts the returns on your SIP based on specific parameters. You simply need to input the SIP amount, the duration of investment and the expected rate of return, and the calculator will wield the results in seconds.</p>
                <p>An investment is when an individual invests a substantial amount at one go in a particular scheme. One of the primary advantages of opting for a one-time investment is that the change in NAV value does not affect the number of units you can purchase.</p>
                <p>You need to input three essential data points; namely, your investment amount, estimated ROI and the duration of your investment.</p>
                <h4>Estimated Returns on Key Schemes</h4>
                <p>There are mainly three types of stocks that you can invest in – equity, debt, and hybrid. Here are some of the most high-yielding stocks in India in each category and their estimated returns.</p>
                <h5>Equity Funds</h5>
                <table class="info-table">
                    <tr>
                        <td>Aditya Birla Sunlife Frontline Equity Fund</td>
                        <td>Moderate</td>
                        <td>9.47%</td>
                        <td>10.50%</td>
                    </tr>
                    <tr>
                        <td>HDFC Mid-cap Opportunities Fund</td>
                        <td>High</td>
                        <td>12.60%</td>
                        <td>16.99%</td>
                    </tr>
                    <tr>
                        <td>ICICI Pru Focused Bluechip Equity Fund</td>
                        <td>Moderate</td>
                        <td>13.18%</td>
                        <td>11.03%</td>
                    </tr>
                </table>
                <h5>Debt Funds</h5>
                <table class="info-table">
                    <tr>
                        <td>Aditya Birla Sun Life Active Debt Multi-manager FoF Scheme</td>
                        <td>Low</td>
                        <td>8.30%</td>
                        <td>6.92%</td>
                    </tr>
                    <tr>
                        <td>Axis Short Term –Direct Plan</td>
                        <td>Moderate</td>
                        <td>10.06%</td>
                        <td>8.25%</td>
                    </tr>
                    <tr>
                        <td>Canara Robeco Income- Reg</td>
                        <td>High</td>
                        <td>13.50%</td>
                        <td>8.94%</td>
                    </tr>
                </table>
                <h5>Hybrid Funds</h5>
                <table class="info-table">
                    <tr>
                        <td>Indiabulls Savings Income Direct-G</td>
                        <td>Low</td>
                        <td>9.02%</td>
                        <td>11.42%</td>
                    </tr>
                    <tr>
                        <td>Mirae Asset Hybrid Equity Direct- G</td>
                        <td>High</td>
                        <td>12.07%</td>
                        <td>14.04%</td>
                    </tr>
                    <tr>
                        <td>ICICI Pru Equity & Debt Direct-G</td>
                        <td>High</td>
                        <td>10.43%</td>
                        <td>12.20%</td>
                    </tr>
                </table>
                <p>When you use a mutual fund returns calculator in India, you will have to insert the variables as mentioned in these tables along with the duration of your investment.</p>
                <h4>How to use Genius's calculator?</h4>
                <p>Online financial solution provider Genius offers a mutual funds return calculator in India, which is exceptionally easy to use.</p>
                <p>Enter the amount you have invested, the expected rate of return and the number of years for which you have made the investment. The appreciated amount of your investment at the end of the specified tenure will be reflected within seconds.</p>
                <h4>Advantages of using the Genius online mutual funds calculator</h4>
                <p>There are several advantages of using these calculators which make the life of investors easier.</p>
                <ul>
                    <li>It provides you with a fairly accurate estimate of the returns on your mutual fund investments.</li>
                    <li>It saves you valuable time by eliminating the need to do the calculations manually.</li>
                    <li>Since it’s an online tool, you can access it anywhere, making it incredibly convenient to perform financial planning on the go.</li>
                </ul>
                <p>Mutual funds, as an investment instrument, are growing at a steady pace in India. Although there is some inherent risk in these investments, the returns are proportionately higher.</p>
            </div>

            <div id="ssy-info" class="calculator-info" style="display: none;">
                <h3>Sukanya Samriddhi Yojana calculator</h3>
                <p>Sukanya Samriddhi Yojana (SSY) is a savings scheme launched back in 2015 as part of the Government initiative Beti Bachao, Beti Padhao campaign. This scheme enables guardians to open a savings account for their girl child with an authorised commercial bank or India Post branch.</p>
                <p>SSY accounts offer an 8.2% rate of interest. A Sukanya Samriddhi Yojana calculator can help you determine the returns you receive as per the invested amount and tenure.</p>
                <h4>Who Can Use This Calculator?</h4>
                <p>The first step to take benefit of the SSY calculator is to check whether the eligibility criteria of the scheme is fulfilled. SSY account can be opened by legal guardians of the girl child provided the following conditions are met:</p>
                <ul>
                    <li>The girl must be an Indian resident</li>
                    <li>The girl shouldn't be more than 10 years of age</li>
                    <li>Up to two accounts can be opened in a family with two girl children</li>
                </ul>
                <p>Additionally, the legal guardians will also need to submit the following documents to be able to start the deposits in the scheme:</p>
                <ul>
                    <li>Duly filled scheme opening document which covers the basic personal details of the account holder and the girl child for whom the account is being opened.</li>
                    <li>Birth certificate of the girl child.</li>
                    <li>Depositor's identification documents as well as valid address proof.</li>
                    <li>Medical certificate in the case of the birth of multiple children under a single birth order.</li>
                    <li>Additional documents requested by the concerned authority.</li>
                </ul>
                <p>Individuals who meet the aforementioned pre-requisites as well as have the supporting documents for the same are eligible for the scheme and hence can go ahead and use the SSY calculator online.</p>
                <h4>How can an SSY calculator help you?</h4>
                <p>Often parents of the girl child look to do investments in the name of their child that can help meet the expenses of their daughter’s education and marriage expenses.</p>
                <p>While there are many investment avenues that can help parents achieve this, Sukanya Samriddhi Yojana has emerged as one of the most popular ones owing to the high-interest rate as well as the tax benefits it offers. Under Section 80 C of the Income Tax Act, 1961, individuals can claim tax exemption up to Rs 1.5 Lakh from the amount contributed to SSY account.</p>
                <p>Moreover, the interest income generated from investing is tax-exempt as well. Tax benefits are extended to the maturity amount too. That being said, parents who have zeroed in on using Sukanya Samriddhi as the preferred investment option, now need a tool to calculate the total amount on maturity that they would receive. The manual calculation is cumbersome and prone to error. This is where the Sukanya Samriddhi Calculator comes in handy.</p>
                <p>According to the maturity amount, investors can make adjustments to regular contributions to reach the desired corpus. The calculator is free to use and can generate error-free output for multiple iterations.</p>
                <p>The Sukanya Samriddhi Yojana is a long-term investment scheme that can generate high ROI. You have to make a minimum contribution each year to keep the account active.</p>
                <p>Hence, using a Sukanya Samriddhi Yojana calculator online is beneficial to have an overall assessment of your investments and returns.</p>
                <p>A few benefits of SSY calculators include:</p>
                <ul>
                    <li>Shows you the year of maturity for your SSY account.</li>
                    <li>Displays the amount you receive upon maturity.</li>
                    <li>Helps you plan your investment portfolio more effectively.</li>
                </ul>
                <h4>How Does The SSY Calculator Work?</h4>
                <p>The tenure for maturity for the amount is 21 years. It is important to note that it is important for individuals to make minimum one contribution a year to keep the scheme alive till 14 years are completed.</p>
                <p>The individual may choose to not make contributions in the SSY account between a year and year 21 if they so wish. However, the previous investments made into the account will continue earning on the prevailing interest rate. The final amount is hence calculated based on your net contribution plus interest earned.</p>
                <p>The Sukanya Yojana calculator uses the following formula to generate results:</p>
                <div class="formula-box">A = P (1 + r/n) ^ nt</div>
                <p>Where –</p>
                <ul>
                    <li>Compound interest</li>
                    <li>Principal amount</li>
                    <li>Rate of interest</li>
                    <li>Number of times interest compounds in a year</li>
                    <li>Number of years</li>
                </ul>
                <h4>How to use Genius's SSY Calculator Online?</h4>
                <p>Just enter the investment amount per year, age of your girl child, and investment starting year.</p>
                <p>The calculator will automatically display the maturity year and the amount you receive upon maturity after you enter the details.</p>
                <h4>Advantages of using the Genius Sukanya Samriddhi Scheme Calculator</h4>
                <p>Using the Genius Sukanya Samriddhi Yojana online calculator provides you with the following benefits:</p>
                <ul>
                    <li>The Genius Sukanya Yojana calculator is free to use and can generate error-free output for multiple iterations.</li>
                    <li>The calculator generates output within seconds.</li>
                    <li>The tool is available online on Genius's website and does not require downloading a utility.</li>
                    <li>You don't have to sign up or login to use the calculator, it does not ask any user information except the input fields.</li>
                    <li>There is no limit to the number of times you can use the SSY calculator.</li>
                    <li>The calculations are made based on the prevailing SSY interest rates for higher accuracy; individuals don't have to manually enter interest rates.</li>
                    <li>The SSY Calculator is up to date and any change implemented in the scheme itself, that affects the calculation of the corpus, will get auto reflected in the workings of the Sukanya Samriddhi calculator.</li>
                    <li>The tool works equally efficiently on all devices.</li>
                </ul>
                <p>The calculator of Sukanya Samriddhi Yojana assists you in determining the amount that you can comfortably invest each year. Opening an SSY account is one of the ways to secure your child’s future against expenses like higher education.</p>
                <h4>How Can I Use The Corpus Accumulated From SSY Contributions?</h4>
                <p>Upon reaching maturity, the entire corpus accumulated can be withdrawn by the girl child. This can be done after the following documents are produced:</p>
                <ul>
                    <li>Withdrawal application form</li>
                    <li>ID Proof and valid address proof</li>
                    <li>Citizenship document</li>
                </ul>
                <p>The corpus withdrawn can be used to meet the expenses of higher education of the girl child, provided she has cleared 10th Standard and reached 18 years of age. The amount can only be used to meet fee and admission charges. To prove that the amount is being utilised for educational purposes, the depositors are required to submit University admission documents as well as fee receipts.</p>
                <p>Premature withdrawal to meet marriage expenses is allowed, provided the girl is 18 and above. The girl will be required to produce an affidavit that states that she is a major.</p>
            </div>

            <div id="tax-info" class="calculator-info" style="display: none;">
                <h3>Income Tax Calculator – Simplified Financial Slabs</h3>
                <p>Calculating your income tax liability manually can be complex and time-consuming. Therefore, using an online income tax calculator can help simplify the calculation. An income tax calculator is an online tool that estimates your tax liability based on your income, applicable tax slabs, and deductions. Learn how to use the new regime income tax calculator, its benefits and how it can simplify your tax planning.</p>
                <h4>What is an Income Tax Calculator?</h4>
                <p>An income tax calculator is an online tool that helps evaluate taxes based on a person’s income, respective tax slab and tax liability. Individuals falling under the taxable income bracket are liable to pay a specific portion of their net annual income as tax. One can choose between the old and new tax regimes, each having different tax rates and deductions.</p>
                <p>Income tax can be paid as tax deducted at source (TDS) during the monthly salary disbursement or through the income tax returns portal managed by the Central Board of Direct Taxes (CBDT). The provision for online payment of taxes ensures that individuals pay their stipulated dues based on any earnings generated from other sources.</p>
                <p>The Income Tax calculator on this page is aligned with the updates announced in the Union Budget for FY 2025-26 and AY 2026-27.</p>
                <h4>Budget 2025 Updates on Income Tax</h4>
                <ul>
                    <li>The income tax rebate was hiked to ₹60,000 from the previous rebate limit of ₹25,000. Meaning, no tax liability on income up to ₹12 lakh under the new tax regime.</li>
                    <li>The TDS limit on rent has been increased to ₹50,000 per month for FY 2025-26.</li>
                    <li>The limit on tax deduction on interest for senior citizens has been increased from ₹50,000 to ₹1,00,000.</li>
                    <li>In the case of Tax Collected at Source (TCS) on remittances under the Reserve Bank of India’s (RBI) Liberalized Remittance Scheme, the threshold has been increased to ₹10 Lakhs from the earlier limit of ₹7 Lakhs. Furthermore, TCS has been removed for education loans acquired to specified financial institutions.</li>
                </ul>
                <h4>Revised Income Tax Slabs Under New Regime for FY 2025-2026 (AY 2026-2027)</h4>
                <table class="info-table">
                    <tr>
                        <th>Income Tax Slabs</th>
                        <th>Tax Rate</th>
                    </tr>
                    <tr><td>Up to ₹4 Lakhs</td><td>Nil</td></tr>
                    <tr><td>₹4 Lakhs - ₹8 Lakhs</td><td>5%</td></tr>
                    <tr><td>₹8 Lakhs - ₹12 Lakhs</td><td>10%</td></tr>
                    <tr><td>₹12 Lakhs - ₹16 Lakhs</td><td>15%</td></tr>
                    <tr><td>₹16 Lakhs - ₹20 Lakhs</td><td>20%</td></tr>
                    <tr><td>₹20 Lakhs - ₹24 Lakhs</td><td>25%</td></tr>
                    <tr><td>Above ₹24 Lakhs</td><td>30%</td></tr>
                </table>
                <h4>How to Use Genius's Online Income Tax Calculator?</h4>
                <p>Follow the steps below to use Genius's Income Tax Calculator:</p>
                <ul>
                    <li>Choose the assessment year for which you want to calculate the tax. For example, if you are looking for FY 2025-26, then select the AY as 2026-27 from the drop-down menu.</li>
                    <li>In the next field, select your age.</li>
                    <li>Next, click on the ‘income field’. Provide details like Gross salary, Annual income from other sources, and Annual income from interest.</li>
                    <li>Enter the details of various deductions under Section 87A, 80C, 80D, 80G, etc.</li>
                    <li>Finally, select whether you live in a metro city and hit the calculate button to obtain your tax liability.</li>
                </ul>
                <h4>How to Calculate Income Tax on Salary?</h4>
                <p>Here’s a simplified overview of calculating your income tax on salary under the New Tax Regime. Standard Deduction for the new regime is set at ₹75,000. Let us consider an example where the salary income of an individual is ₹18,00,000 per annum and income from other sources is ₹35,000:</p>
                <table class="info-table">
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                    </tr>
                    <tr><td>Salary Income</td><td>₹18,00,000</td></tr>
                    <tr><td>Standard Deduction</td><td>₹75,000</td></tr>
                    <tr><td>Salary Income (-) Standard Deduction</td><td>₹17,25,000</td></tr>
                    <tr><td>Income from Other Sources</td><td>₹35,000</td></tr>
                    <tr><td><strong>Total Taxable Income</strong></td><td><strong>₹17,60,000</strong></td></tr>
                </table>
                <h5>Applicable Tax Rate Calculation Breakup:</h5>
                <table class="info-table">
                    <tr>
                        <th>Tax Slab</th>
                        <th>Applicable Tax Rate</th>
                        <th>Amount</th>
                    </tr>
                    <tr><td>Up to ₹4 Lakhs</td><td>Nil</td><td>₹0</td></tr>
                    <tr><td>More than ₹4 Lakhs and up to ₹8 Lakhs</td><td>5%</td><td>₹20,000</td></tr>
                    <tr><td>More than ₹8 Lakhs and up to ₹12 Lakhs</td><td>10%</td><td>₹40,000</td></tr>
                    <tr><td>More than ₹12 Lakhs and up to ₹16 Lakhs</td><td>15%</td><td>₹60,000</td></tr>
                    <tr><td>More than ₹16 Lakhs and up to ₹20 Lakhs</td><td>20%</td><td>₹32,000</td></tr>
                    <tr><td><strong>Income Tax Base Total</strong></td><td>-</td><td><strong>₹1,52,000</strong></td></tr>
                    <tr><td>Health & Education Cess</td><td>4% of the tax amount</td><td>₹6,080</td></tr>
                    <tr><td><strong>Total tax to be paid</strong></td><td>-</td><td><strong>₹1,58,080</strong></td></tr>
                </table>
                <h4>Benefits of Income Tax Calculator</h4>
                <ul>
                    <li><strong>Accuracy:</strong> An online income tax calculator ensures accurate tax calculation, reducing human calculation error profiles.</li>
                    <li><strong>Speed and Convenience:</strong> Calculate your taxes anytime, anywhere without conventional paper layout vulnerabilities.</li>
                    <li><strong>Easy to Use:</strong> User-friendly parameter configurations with no setup limitations.</li>
                    <li><strong>Improves Expense Management:</strong> Offers visibility over tax footprints proactively to optimize investment sizing.</li>
                    <li><strong>Data Privacy:</strong> Online systems safeguard core variables securely without risk profiles typical of paper records.</li>
                </ul>
            </div>

            <div id="ppf-info" class="calculator-info" style="display: none;">
                <h3>PPF Calculator</h3>
                <p>The first step towards wealth management is accumulating savings. You will find a lot of options for savings accounts; however, look for the ones that guarantee substantial returns risk-free. PPF accounts are one of the most common features which come into the picture. PPF account refers to Public Provident fund account and is meant to invest your valuable capital.</p>
                <p>If you are a new employee or a responsible parent who wishes to save for the future, then PPF is ideal for you. Calculating the interest rates and returns on your PPF account turns a bit difficult. To make these difficult calculations easy, PPF account calculator can be used.</p>
                <h4>How can a PPF calculator help you?</h4>
                <p>This financial tool allows one to resolve their queries related to Public Provident Fund account. There are certain specifications that are to be abided by while calculating maturity amount after a certain point of time. It keeps a track on the growth of your capital. Those who already have a PPF savings account know that interest rates change on monthly basis.</p>
                <p>Nowadays, it is easier to keep a check on changing rates. However, with the discovery of public provident fund calculator, account holders find it easier to find out monthly changes made in interest. In the market, you may find a lot of user-friendly PPF calculators, and when choosing a trustworthy one, Genius is simply the best option.</p>
                <h4>Formula used for calculating PPF</h4>
                <p>Genius uses a formula to compute the deposited amount, interest, etc. This formula has been given below:</p>
                <div class="formula-box">F = P [({(1+i) ^n}-1)/i]</div>
                <p>This formula represents the following variables:</p>
                <ul>
                    <li>I Rate of interest</li>
                    <li>F Maturity of PPF</li>
                    <li>N Total number of years</li>
                    <li>P Annual instalments</li>
                </ul>
                <p>In order to clear your concept about PPF calculation, an example has been given. This calculation becomes easier once you buy PPF calculator.</p>
                <p>Suppose, an individual pays an annual amount of ₹1,50,000 in their PPF investment for a period of 15 years at an interest rate of 7.1%, then his/her maturity sum at the closing year will be equal to ₹40,68,209 (approx).</p>
                <p>A quick check on opening balance, closing balance, assuming no withdrawals.</p>
                <table class="info-table">
                    <tr>
                        <th>Year</th>
                        <th>Opening amount</th>
                        <th>Deposit</th>
                        <th>Rate of interest</th>
                        <th>Closing amount</th>
                        <th>Amount withdrawn</th>
                    </tr>
                    <tr><td>1</td><td>0</td><td>₹1,50,000</td><td>₹10,650</td><td>₹1,60,650</td><td>0</td></tr>
                    <tr><td>2</td><td>₹1,60,650</td><td>₹1,50,000</td><td>₹22,056</td><td>₹3,32,706</td><td>0</td></tr>
                    <tr><td>3</td><td>₹3,32,706</td><td>₹1,50,000</td><td>₹34,272</td><td>₹5,16,978</td><td>0</td></tr>
                    <tr><td>4</td><td>₹5,16,978</td><td>₹1,50,000</td><td>₹47,355</td><td>₹7,14,334</td><td>0</td></tr>
                    <tr><td>5</td><td>₹7,14,334</td><td>₹1,50,000</td><td>₹61,368</td><td>₹9,25,701</td><td>0</td></tr>
                    <tr><td>6</td><td>₹9,25,701</td><td>₹1,50,000</td><td>₹76,375</td><td>₹11,52,076</td><td>0</td></tr>
                    <tr><td>7</td><td>₹11,52,076</td><td>₹1,50,000</td><td>₹92,447</td><td>₹13,94,524</td><td>0</td></tr>
                    <tr><td>8</td><td>₹13,94,524</td><td>₹1,50,000</td><td>₹1,09,661</td><td>₹16,54,185</td><td>0</td></tr>
                    <tr><td>9</td><td>₹16,54,185</td><td>₹1,50,000</td><td>₹1,28,097</td><td>₹19,32,282</td><td>0</td></tr>
                    <tr><td>10</td><td>₹19,32,282</td><td>₹1,50,000</td><td>₹1,47,842</td><td>₹22,30,124</td><td>0</td></tr>
                    <tr><td>11</td><td>₹22,30,124</td><td>₹1,50,000</td><td>₹1,68,989</td><td>₹25,49,113</td><td>0</td></tr>
                    <tr><td>12</td><td>₹25,49,113</td><td>₹1,50,000</td><td>₹1,91,637</td><td>₹28,90,750</td><td>0</td></tr>
                    <tr><td>13</td><td>₹28,90,750</td><td>₹1,50,000</td><td>₹2,15,893</td><td>₹32,56,643</td><td>0</td></tr>
                    <tr><td>14</td><td>₹32,56,643</td><td>₹1,50,000</td><td>₹2,41,872</td><td>₹36,48,515</td><td>0</td></tr>
                    <tr><td>15</td><td>₹36,48,515</td><td>₹1,50,000</td><td>₹2,69,695</td><td>₹40,68,209</td><td>0</td></tr>
                </table>
                <p>Apart from yearly PPF calculations, monthly calculations are also possible with PPF calculator monthly.</p>
                <h4>How to use PPF calculator?</h4>
                <p>To enjoy this computing tool to the maximum, you need to understand how it works. Its user-friendly and accurate information makes it a device worthy of purchase. The only job of the user is to put values within specific columns and you are good to go. Details that are to be provided to this PPF amount calculator include tenure, total amount invested, interest earned and also amount invested monthly or yearly.</p>
                <p>Enter the values in the requisite fields and the total maturity amount will be reflected within seconds.</p>
                <p>If an individual deposits amount on 1st of April then interest will be calculated based on financial year. Inflation might affect this interest rate.</p>
                <h4>Advantages of using PPF calculator</h4>
                <p>The list below demonstrates benefits of using online PPF calculator. Have a look at it.</p>
                <ul>
                    <li>This computing device allows users to get a clear idea about how much interest can be earned with the investment of a certain amount of money.</li>
                    <li>With the assistance of this calculator, you can be saved from paying hefty tax.</li>
                    <li>We often find it difficult to decide on maturity period of their investment and this problem is easily solved with the use of PPF calculator India .</li>
                    <li>It also offers estimation on total investment in a financial year.</li>
                    <li>To ensure that the user is able to get accurate result, it is essential to provide the computing device with deposited amount along with type of deposit i.e. fixed or variable.</li>
                </ul>
            </div>

            <div id="epf-info" class="calculator-info" style="display: none;">
                <h3>EPF Calculator</h3>
                <p>Most private sector employees are entitled to receive post-retirement benefits if they function in the organised sector. Note that government employees are additionally eligible for pensions unlike their private sector counterparts. Employee Provident Fund was set up after the EPF Act was passed in the Parliament. Under the law, the Employees Provident Fund Organisation of India (or EFPO) controls the funds deposited by both the employee and employer in a permanent account, affixed by an UAN or Unique Account Number. An EPF calculator can help you estimate your savings appropriately.</p>
                <p>The PF calculator uses proprietary technology to fetch the correct sum every time you input data. Provident Fund acts as a guarantee for future prosperity or loss of employment, and is of great use for future financial decision-making.</p>
                <h4>How can an EPF calculator help you?</h4>
                <p>Once you start using our PF calculator in India, you can easily track where your hard-earned money is being stored, and how much interest it has accumulated.</p>
                <p>Here are some interesting advantages of using an EPF calculator online.</p>
                <ul>
                    <li>You do not have to manually calculate your total contributions each time.</li>
                    <li>We assure that our PF calculator online works correctly on every occasion.</li>
                    <li>You do not have to worry if the interest rates or contribution ratios vary over a period. The calculator will automatically take into account the alteration.</li>
                    <li>Finally, whenever you use our calculator, you are automatically informed of any recent transactions, contributions and changes, if any.</li>
                </ul>
                <h4>The formula to determine EPF amount</h4>
                <p>When you use Genius's EPF calculator in India, you are assured of quality and reliability. This is the data you should keep in handy before you use the calculator.</p>
                <ul>
                    <li>Your basic monthly salary including Dearness Allowance (DA)</li>
                    <li>Your contribution to the EPF</li>
                    <li>Your employer’s contribution</li>
                    <li>Your retirement age (Including VRS, if you have such plans.)</li>
                    <li>Your current EPF balance</li>
                    <li>Current EPF interest rate</li>
                </ul>
                <h4>How to use Genius's EPF calculator?</h4>
                <p>It is very easy to access and use our EPF calculator. Just input the values and the result will be generated within seconds.</p>
                <ul>
                    <li><strong>Step 1:</strong> Enter your basic salary and your age</li>
                    <li><strong>Step 2:</strong> As soon as you input the values, the employer’s contribution ( EPS+EPF), total interest earned and total maturity amount will be reflected in the results.</li>
                </ul>
                <h4>What are the advantages of Genius's PF account calculator?</h4>
                <p>Genius offers you a number of choices with many different calculators, a list of which you can see below. All of our calculators are free to use. They are regularly updated to avoid any glitches.</p>
            </div>

            <div id="gst-info" class="calculator-info" style="display: none;">
                <h3>GST Calculator – Goods and Services Tax Calculator</h3>
                <p>The GST Act was passed by the parliament on March 29, 2017 and implemented from July 1 of the same year. The Goods and Services Tax is an indirect tax levied by the Indian government on all goods and services purchased within its jurisdiction. It is a single tax that has eliminated multiple indirect taxes of the previous regime such as sales tax, VAT, Excise Duty, etc.</p>
                <p>Every enterprise operating in India has to mandatorily register for the GST. They are required to have a GST Identification Number or GSTIN. Consumers have to pay this tax for all goods they purchase and all the services they avail. As such, it is paramount that one understands how to compute GST accurately. You may take the help of the GST calculator to evaluate the same.</p>
                <h4>How Can a GST Calculator Help You?</h4>
                <p>Everything that you purchase, be it a product or a service, is taxed under the GST amount. It’s to your advantage to know how much tax you are paying for the products you use. That’s where an Indian GST calculator can come to your aid.</p>
                <ul>
                    <li>GST tax calculator provides you with an accurate estimate of the amount of tax you have to pay.</li>
                    <li>It helps you save time for the calculation of GST.</li>
                    <li>It eliminates the chances of any fraudulent activities if you are an aware consumer who knows his/her taxes.</li>
                </ul>
                <h4>Formula to Determine GST Amount</h4>
                <p>The GST amount calculator uses a standardised method to calculate GST. There are 2 aspects of this calculator- adding GST and removing GST from the total price of an item.</p>
                <h5>For adding GST, the following formula is used:</h5>
                <div class="formula-box">
                    GST amount = (Price × GST%)<br>
                    Net price = Cost of the product + GST amount
                </div>
                <p>For example, if a product or service costs Rs. 100 and the GST levied on that is 18%, the GST amount will be 100 × 18% = Rs. 18. The net amount you’d have to pay would be Rs. 118.</p>
                <h5>For removing GST from the net price of a product, the following formula is used:</h5>
                <div class="formula-box">
                    GST = Original cost – [Original cost × {100 / (100 + GST%)}]<br>
                    Net price = Original cost – GST
                </div>
                <p>For example, if the cost of a product after GST of 18% is Rs. 118, its original cost is 118 – [100 / (100 + 18%)], which equates to Rs. 100.</p>
                <h4>How to Use the Genius GST Calculator Online</h4>
                <p>You can use the GST calculator India from the Genius website within minutes. You have to simply-</p>
                <ul>
                    <li>Input the variables, i.e., original cost and GST percentage.</li>
                    <li>The GST amount will be displayed immediately.</li>
                </ul>
                <h4>What is GST Inclusive Amount</h4>
                <p>GST inclusive amount means the total value of the product after including the GST amount in the original price. Herein, the tax is not charged separately from the customer since it is already included in the price.</p>
                <h4>What is GST Exclusive Amount</h4>
                <p>GST Exclusive Amount means the value of the product without GST being included. To calculate this amount, the GST amount is subtracted from the product's GST inclusive value.</p>
                <h4>Advantages of using the Genius GST calculator</h4>
                <ul>
                    <li>You can figure out the tax amount you are paying.</li>
                    <li>It is quick and accurate, thereby saving you valuable time.</li>
                    <li>You stay protected from any fraudulent activities that may arise out of wrong GST calculation.</li>
                </ul>
                <p>GST has fundamentally changed the tax regime in India. All enterprises, regardless of their size or area of operation, now fall under the same tax umbrella throughout the country. Use the GST calculator online and find out how much tax you are paying for the goods and services you purchase.</p>
            </div>

            <div id="fd-info" class="calculator-info" style="display: none;">
                <h3>FD Calculator</h3>
                <p>A fixed deposit is a type of term investment offered by several banks and NBFCs. These deposits typically offer a higher rate of interest, subject to certain terms and conditions. The amount you deposit in these deposits is locked for a predetermined period which can vary between 7 days and 10 years.</p>
                <p>An FD calculator can be used to determine the interest and the amount that it will accrue at the time of maturity. It is a simple-to-use tool available on the Genius website.</p>
                <h4>How can an FD calculator help you?</h4>
                <p>Calculating the maturity amount of an FD can be a complicated and time-consuming process. An online FD calculator enables one to figure it without breaking a sweat.</p>
                <ul>
                    <li>FD maturity calculations are complex involving multiple variables. A Fixed Deposit Calculator does all the hard work and gives you accurate figures just at the click of a button.</li>
                    <li>It helps you save a lot of time on these complex calculations.</li>
                    <li>A fixed deposit return calculator enables you to compare the maturity amount and interest rates of FDs offered by different financial institutions. You can make an informed decision when you have all the figures at your disposal.</li>
                </ul>
                <h4>The formula to determine FD maturity amount</h4>
                <p>There are two types of FDs that you may avail of: simple interest FDs and compound interest FDs. Genius has calculators for both types of FDs.</p>
                <h5>The fixed deposit calculator for simple interest FD uses the following formula –</h5>
                <div class="formula-box">M = P + (P × r × t / 100)</div>
                <p>Where –</p>
                <ul>
                    <li><strong>P</strong> is the principal amount that you deposit</li>
                    <li><strong>r</strong> is the rate of interest per annum</li>
                    <li><strong>t</strong> is the tenure in years</li>
                </ul>
                <p>For example, if you deposit a sum of Rs. 1,00,000 for 5 years at 10% interest, the equation reads –<br>M = Rs. 1,00,000 + (1,00,000 × 10 × 5 / 100) = Rs. 1,50,000</p>
                <h5>For compound interest FD, the FD return calculator uses the following formula –</h5>
                <div class="formula-box">M = P + P {(1 + i/100)<sup>t</sup> – 1}</div>
                <p>Where –</p>
                <ul>
                    <li><strong>P</strong> is the principal amount</li>
                    <li><strong>i</strong> is the rate of interest per period</li>
                    <li><strong>t</strong> is the tenure</li>
                </ul>
                <p>For example, if you take the same variables, the compound interest FD will accrue,<br>M = Rs. 1,00,000 {(1 + 10/100)<sup>5</sup> - 1} = Rs. 1,61,051</p>
                <h4>How to use Genius's FD calculator?</h4>
                <p>Follow the steps mentioned below to use an FD deposit calculator conveniently.</p>
                <ul>
                    <li>Ensure you have all the related data available to you.</li>
                    <li>Enter the variables as mentioned in the formula on their designated slots.</li>
                    <li>The FD maturity amount will be displayed instantly.</li>
                </ul>
                <h4>Advantages of using the Genius FD calculator in India</h4>
                <p>Know the exact amount you will receive at the time of FD maturity using the FD amount calculator.</p>
                <p>There are several other advantages of using these calculators –</p>
                <ul>
                    <li>Get the exact amount you are eligible for at the end of your maturity period and plan your future accordingly.</li>
                    <li>Both of these calculators are free for unlimited use by registered users.</li>
                    <li>Compare the maturity amount of different financial institutions easily.</li>
                </ul>
            </div>

            <div id="rd-info" class="calculator-info" style="display: none;">
                <h3>RD Calculator</h3>
                <p>Recurring deposits (RDs) are an investment instrument almost similar to fixed deposits. However, you have to make fixed monthly deposits in RDs, unlike a lump sum amount in FDs. RDs create a habit of regular investment among earning individuals. These also instil discipline when it comes to savings. Recurring deposits are offered by the majority of banks and financial institutions.</p>
                <p>RD returns calculations can be quite complicated for an average investor to figure out accurately every time. This is where an RD calculator can prove to be immensely beneficial.</p>
                <h4>How can an RD calculator help you?</h4>
                <p>A recurring deposit, as the name suggests, is a continuing investment. The returns on these deposits can be challenging to track for investors. The interest is compounded quarterly, and there are several variables involved, which makes the calculations multipart.</p>
                <p>An RD deposit calculator eliminates the hassle of computing its returns manually and enables an investor to know the exact amount their deposits will accrue after the relevant period.</p>
                <p>The only consideration that the investor has to do manually is the TDS deduction. As per new RBI norms, RDs are also liable for TDS deduction; however, there is no uniformity in its implementation across financial institutions, which is why RD calculators don’t take it into account.</p>
                <p>Apart from that small caveat, an RD amount calculator offers an investor with the following advantages:</p>
                <ul>
                    <li>The calculator enables investors to plan their future finances with greater clarity by providing them with the exact amount their investment will accrue.</li>
                    <li>It’s convenient to use and saves a lot of time for the investors, which they can otherwise use productively.</li>
                    <li>The accuracy of these calculators can never be in question. Accurate estimates are pivotal for prudent financial planning.</li>
                </ul>
                <h4>Formula to determine RD maturity</h4>
                <p>There are three variables that go into the calculation of the RD maturity amount. An RD account calculator assigns these variables to a standard formula to arrive at the exact maturity amount.</p>
                <p>The formula for RD maturity is as follows:</p>
                <div class="formula-box">A = P*(1+R/N)^(Nt)</div>
                <p>The variables in this equation represent-</p>
                <ul>
                    <li><strong>A</strong> Maturity Amount</li>
                    <li><strong>P</strong> RD Instalment each month</li>
                    <li><strong>N</strong> Compounding Frequency (no. of quarters)</li>
                    <li><strong>R</strong> RD interest rate in percentage</li>
                    <li><strong>T</strong> Tenure</li>
                </ul>
                <p>This is the standard formula used in the calculation of the RD maturity amount, regardless of the sum invested or tenure. All you need to do is put in the variables.</p>
                <p>For example, an individual starts an RD account for an investment of Rs. 5000 per month for a tenure of 1 year, i.e. 4 quarters. The interest accrued on this account is 8%. The final maturity amount on this particular deposit is calculated with the following formula-</p>
                <div class="formula-box">
                    A = P*(1+R/N)^(Nt)<br>
                    = 5000*(1+.0825/4)^(4*12/12) = 5425.44<br>
                    = 5000*(1+.0825/4)^(4*11/12) = 5388.64<br>
                    …<br>
                    = 5000*(1+.0825/4)^(4*1/12) = 5034.14
                </div>
                <p>By taking the sum of series, total maturity value, i.e. A = Rs 62,730.85</p>
                <p>Solving this equation manually is no mean task. A recurring deposit calculator, on the other hand, will provide you with the exact number in mere seconds.</p>
                <p>The maturity value for the depositor on the investment in RD is INR Rs 62,730.85</p>
                <h4>How to use the Genius RD calculator online?</h4>
                <p>The RD calculator available on the Genius website is straightforward to use and does not require any subject expertise. Here is a step-by-step guide for using this calculator.</p>
                <ul>
                    <li><strong>Step 1:</strong> Input the monthly amount you would be putting in the recurring deposit</li>
                    <li><strong>Step 2:</strong> Enter the number of years and the expected rate of return.</li>
                </ul>
                <p>The total value of the investment after the tenure will be expressed within seconds.</p>
                <h4>Advantages of using RD maturity calculator</h4>
                <p>Using Genius's online RD calculator in India comes with its fair share of advantages. Depositors can use this calculator and avail the following benefits:</p>
                <ul>
                    <li>It is a time-saving instrument. It performs the calculations in seconds, and the entire procedure starting with visiting their website takes no more than 1-2 minutes.</li>
                    <li>It is always accurate. There is no chance of any mistakes or ambiguity if you input every variable correctly.</li>
                    <li>This RD amount calculator is free to use as many times as a depositor wishes. You can input one or more of the variables in as many variations you want.</li>
                </ul>
                <p>Recurring deposit is considered a stable financial investment with potentially high returns. You may compare the performances of several other investment schemes for the same amount using online calculators available and make a decision accordingly.</p>
            </div>

            <div id="emi-info" class="calculator-info" style="display: none;">
                <h3>EMI Calculator</h3>
                <p>The credit market in India is steadily on the rise. It is currently the 4th largest credit industry in the world, recording a CAGR of over 11% year on year. A vast majority of these advances are short-term credits such as personal loans and credit cards. Combined, these two financial products account for 78% of all credit lending in India. Loan repayments include EMIs and borrowers should consider the EMI amount to accurately plan their current and future finances.</p>
                <p>There are several EMI calculators available online; one must choose an accurate EMI calculator and learn its usage to calculate the exact EMI amount they are liable to pay for a loan.</p>
                
                <h4>Factors Affecting Your Due Amount</h4>
                <p>There are certain factors you need to consider while planning for applying for a loan. Based upon your financial and repayment capacity, you will be required to calculate equated monthly installments (EMI). Here are a few factors to consider:</p>
                <ul>
                    <li><strong>Term of the loan:</strong> A loan’s tenure may get reduced or extended. Subsequently, there will be an increase or a decrease in the EMI amount as well. Thus, considering the term of a loan is also an important factor that may affect your due amount.</li>
                    <li><strong>Rate of interest:</strong> The rate of interest is a vital factor that will help to assess the installment amount owed. You can compare the product and opt for one which has a lower rate of interest so that your overall repayment stays low.</li>
                    <li><strong>Amount of loan:</strong> Choosing the loan amount is another significant factor for determining your EMI. Based on the loan amount you choose, your equated monthly installment will be calculated accordingly.</li>
                </ul>

                <h4>How can an online EMI calculator help you?</h4>
                <p>The number of credit accounts is growing at an even higher CAGR of 28% and has reached 107 million accounts at the end of FY18.</p>
                <p>Regardless of the type of loan you want to avail of, be it a secured or unsecured advance, it is paramount that you know how much monthly instalment you have to make before you avail it. That is where an EMI calculator in India can be immensely helpful.</p>
                <ul>
                    <li>It helps you get an accurate estimate of your EMI amount so that you can plan your finances accordingly. Make sure that your debt-to-income ratio is below 50% to maximize your chances of loan approval.</li>
                    <li>A loan EMI Calculator helps you save valuable time. You don’t have to do complex calculations manually, which can be quite time-consuming.</li>
                    <li>It eliminates any chance of a miscalculation, providing you with an accurate estimate every time.</li>
                    <li>It is highly specific for each type of loan. The EMI breakup of a home loan, for example, is different from that of a personal loan.</li>
                </ul>

                <h4>The formula to determine loan EMI amount</h4>
                <p>There is a specific formula that Genius uses to compute the EMI amount for a loan.</p>
                <div class="formula-box">EMI = [P × R × (1+R)<sup>N</sup>] / [(1+R)<sup>N</sup> - 1]</div>
                <p>Where –</p>
                <ul>
                    <li><strong>P</strong> is the principal amount</li>
                    <li><strong>R</strong> is the rate of interest</li>
                    <li><strong>N</strong> is the loan tenure</li>
                </ul>
                <p>This is the standardized formula used by any online loan calculator. Some variables may be added based on the type of loan.</p>

                <h4>Types Of EMI Calculator</h4>
                <p>There are numerous types of EMI Calculators that you can use on Genius to calculate your equated monthly installments for home loans, personal loans, car loans, etc.</p>
                
                <h5>Home Loan EMI Calculator</h5>
                <p>Home loans usually have a huge loan principal amount and a long tenure. It requires strategic planning for its repayment. You can use the Home Loan EMI Calculator from Genius to calculate your EMI. It is a user-friendly designed calculator that can help you calculate and assess your home loan EMIs immediately. All you need to do is enter your loan amount, loan tenure, and rate of interest and the results will be calculated instantly.</p>
                
                <h5>Car Loan EMI Calculator</h5>
                <p>Buying a car is one of the major investments one can make. You may require a car loan to fund this substantial investment. Often, a car loan’s EMI is supposed to be repaid with due interest within a stipulated time to the lender. On failure, your car may be taken away and put up for auction to recover the balance amount left to be paid. Thus, to calculate a precise EMI amount that you can afford to pay comfortably, you can use the Car Loan EMI Calculator from Genius. You just need to enter your loan amount, interest rate, and loan tenure, and you will get the monthly EMI amount instantly.</p>
                
                <h5>Personal Loan EMI Calculator</h5>
                <p>Personal loans are mostly taken to serve multiple purposes like medical emergency, vacation, relocation, wedding, home renovation, etc. Since they are an unsecured loan, they have a relatively higher interest rate and a shorter tenure. You can use the Personal Loan EMI Calculator from Genius to assess the loan and EMI amount that you can pay with ease. By entering your loan amount, rate of interest, and loan tenure, you can calculate your EMI.</p>
                
                <h5>Education Loan EMI Calculator</h5>
                <p>Affording good education in recent times has been quite a task for parents as its cost has risen at a rapid pace. To finance this cost, an education loan is one of the best options a parent can opt for. Such loans can be taken for a student’s education within the country or even overseas. The loan’s EMI is required to be repaid with interest after a moratorium period. By entering the loan amount, rate of interest, and loan tenure in the Education Loan EMI Calculator, you can calculate the sum of the EMI amount which you need to repay.</p>
                
                <h5>Loan against Property EMI Calculator</h5>
                <p>A loan against property is a type of secured loan that one can avail against a property owned by them. Be it residential, commercial, or land, any property can be mortgaged with the lender against a loan. For calculating the EMI amount which you can repay without any financial strain, you can use a Loan against Property EMI Calculator.</p>

                <h4>How to use the Genius online EMI calculator?</h4>
                <p>The Genius online calculator is easy to use and takes just a few seconds of your time. Here’s how.</p>
                <ul>
                    <li>Insert the variable vis-à-vis principal, tenure and rate of interest.</li>
                    <li>The calculated EMI value will be displayed immediately.</li>
                </ul>

                <h4>Advantages of using the Genius calculator</h4>
                <ul>
                    <li>It is entirely free of charge. Anyone can use it at any time, as many times as they want.</li>
                    <li>Our loan calculator online is 100% accurate every time.</li>
                    <li>It’s fast and provides an accurate estimate instantaneously.</li>
                </ul>
                <p>Apart from the loan EMI calculator, Genius also offers other calculators as you can see below. All of them are free to use and you can use them as many times as you want.</p>
            </div>
            
        </div>
    </section>

    <!-- Floating Contact Buttons -->
    <div id="floating-contacts" class="floating-contacts">
        <a href="https://wa.me/917317064063?text=Hello%20Genius%20Enterprises,%20I%20would%20like%20to%20know%20more%20about%20your%20services." target="_blank" class="floating-btn whatsapp-float" title="WhatsApp Us">
            <i class="fab fa-whatsapp"></i>
        </a>
        <a href="tel:+917317064063" class="floating-btn phone-float" title="Call Us">
            <i class="fas fa-phone-alt"></i>
        </a>
    </div>

    <!-- Get In Touch Section -->
    <section id="contact" class="content-section">
        <div class="content-wrapper text-center" style="text-align: center; flex-direction: column;">
            <i class="fas fa-headset section-icon"></i>
            <h2>Get in touch</h2>
            <p>Pick the channel that works best for you.</p>
            
            <div class="contact-action-icons">
                <a href="tel:+917317064063" class="large-contact-btn phone">
                    <i class="fas fa-phone-alt"></i> 
                    <span class="contact-title">Call Us</span>
                    <span class="contact-detail">+91 7317064063</span>
                    <span class="contact-subtext">Mon–Sat &middot; 9:30 AM to 7 PM IST</span>
                </a>

                <a href="https://wa.me/917317064063?text=Hello%20Genius%20Enterprises,%20I%20would%20like%20to%20know%20more%20about%20your%20services." target="_blank" class="large-contact-btn whatsapp">
                    <i class="fab fa-whatsapp"></i> 
                    <span class="contact-title">WhatsApp</span>
                    <span class="contact-detail">+91 7317064063</span>
                    <span class="contact-subtext">Mon–Sat &middot; 9:30 AM to 7 PM IST</span>
                </a>

                <a href="mailto:geniusenterprises189837@gmail.com?subject=Website%20Inquiry&body=Hello%20Genius%20Enterprises,%20I%20would%20like%20to%20know%20more%20about%20your%20services." class="large-contact-btn email">
                    <i class="fas fa-envelope"></i> 
                    <span class="contact-title">Email</span>
                    <span class="contact-detail">geniusenterprises189837@gmail.com</span>
                    <span class="contact-subtext">Response within 4 working hours</span>
                </a>

                <div class="large-contact-btn office">
                    <i class="fas fa-clock"></i> 
                    <span class="contact-title">Office Hours</span>
                    <span class="contact-detail">Mon to Sat &middot; 9:30 AM – 7 PM</span>
                    <span class="contact-subtext">Sunday by appointment only</span>
                </div>

                <a href="https://maps.app.goo.gl/BBG3dgjjcGwnEo4r9" target="_blank" rel="noopener noreferrer" class="large-contact-btn office" style={{ textDecoration: 'none' }}>
                    <i class="fas fa-map-marker-alt"></i> 
                    <span class="contact-title">Our Office</span>
                    <span class="contact-detail" style={{ fontSize: '0.82rem', lineHeight: '1.3' }}>SH 11/50 D-L PATEL NAGAR COLONY SECTOR A-3 CHATARIPUR SHIVPUR VARANASI -221003</span>
                    <span class="contact-subtext">Click to open in Google Maps</span>
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="main-footer">
        <div class="footer-container">
            <div class="footer-column">
                <h3>Genius Enterprises</h3>
                <p>Your dedicated partner in wealth management, investment planning, and securing your financial future for the long term.</p>
                <div class="footer-socials">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="https://www.linkedin.com/in/siddharth-patel-108581304/"><i class="fab fa-linkedin-in"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                </div>
            </div>

            <div class="footer-column">
                <h3>Services</h3>
                <ul class="footer-links">
                    <li><a href="#equity">Equity Trading</a></li>
                    <li><a href="#mutual-funds">Mutual Funds</a></li>
                    <li><a href="#pms">Portfolio Management</a></li>
                    <li><a href="#aif">Alternative Investments</a></li>
                </ul>
            </div>

            <div class="footer-column">
                <h3>Planning</h3>
                <ul class="footer-links">
                    <li><a href="#financial">Financial Planning</a></li>
                    <li><a href="#insurance">Insurance Support</a></li>
                    <li><a href="#sif">Specialized Funds</a></li>
                    <li><a href="#contact">Consult an Expert</a></li>
                </ul>
            </div>

            <div class="footer-column">
                <h3>Contact Us</h3>
                <ul class="footer-contact">
                    <li><i class="fas fa-map-marker-alt"></i> <a href="https://maps.app.goo.gl/BBG3dgjjcGwnEo4r9" target="_blank" rel="noopener noreferrer" style={{color: '#e6eef8', textDecoration: 'none'}}>SH 11/50 D-L PATEL NAGAR COLONY SECTOR A-3 CHATARIPUR SHIVPUR VARANASI -221003</a></li>
                    <li><i class="fas fa-phone-alt"></i> +91-7317064063</li>
                    <li><i class="fas fa-envelope"></i> geniusenterprises189837@gmail.com</li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2026 Genius Enterprises. All Rights Reserved.</p>
        </div>
    </footer>

    <!-- Floating WhatsApp FAB (auto shows/hides on scroll via existing JS handler) -->
    <div id="floating-contacts">
        <a href="https://wa.me/917317064063?text=Hello%20Genius%20Enterprises%2C%20I%20would%20like%20to%20inquire%20about%20your%20financial%20services%20and%20investment%20plans."
           target="_blank"
           rel="noopener noreferrer"
           class="floating-btn whatsapp-float"
           title="Chat with us on WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
    </div>

    <button id="scrollTopBtn" class="scroll-top-btn" title="Go to top">
        <i class="fas fa-arrow-up"></i>
    </button>

    
<!-- Code injected by live-server -->

` }} />
        </div>
    );
}
