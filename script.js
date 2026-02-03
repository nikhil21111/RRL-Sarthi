// Global variables
let countdownInterval;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePass();
    setupEventListeners();
});

// Initialize pass data
function initializePass() {
    
    const storedData = getStoredPassData();
    const today = getCurrentDate();
    
    // Check if pass is from today
    if (storedData && storedData.date === today) {
        // Load existing pass
        loadExistingPass(storedData);
    } else {
        // Generate new pass for today
        generateNewPass();
    }
    
    startCountdown();
}

// Get stored pass data from localStorage
function getStoredPassData() {
    const data = localStorage.getItem('rrlPassData');
    return data ? JSON.parse(data) : null;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Load existing pass from localStorage
function loadExistingPass(data) {
    document.getElementById('userName').value = data.name || 'NIKHIL VEKARIYA';
    document.getElementById('bookingTime').value = data.bookingTime;
    document.getElementById('passNumber').textContent = data.passNumber;
    
    updateDisplayedTimes(data.bookingTime);
}

// Generate new pass with random time between 8-9 AM
function generateNewPass() {
    const now = new Date();
    const randomMinutes = Math.floor(Math.random() * 60); // 0-59
    const randomSeconds = Math.floor(Math.random() * 60); // 0-59
    
    now.setHours(8, randomMinutes, randomSeconds, 0);
    
    const bookingTimeValue = formatDateTimeForInput(now);
    const passNumber = generatePassNumber(now);
    const name = document.getElementById('userName').value;
    
    document.getElementById('bookingTime').value = bookingTimeValue;
    document.getElementById('passNumber').textContent = passNumber;
    
    updateDisplayedTimes(bookingTimeValue);
    savePassData(name, bookingTimeValue, passNumber);
}

// Format date for datetime-local input
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Generate pass number (Format: DDMMHHMMSS + M + 5 random chars)
function generatePassNumber(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const randomChars = generateRandomString(5);
    
    return `${day}${month}${hours}${minutes}${seconds}M${randomChars}`;
}

// Generate random alphanumeric string
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Update displayed times (booking and validity)
function updateDisplayedTimes(bookingTimeValue) {
    const bookingDate = new Date(bookingTimeValue);
    
    // Format booking time display
    const bookingDisplay = formatDisplayTime(bookingDate);
    document.getElementById('bookingTimeDisplay').textContent = bookingDisplay;
    
    // Calculate and display validity time (same day at 11:59 PM)
    const validityDate = new Date(bookingDate.getFullYear(), 
                                   bookingDate.getMonth(), 
                                   bookingDate.getDate(), 
                                   23, 59, 0, 0);
    const validityDisplay = formatDisplayTime(validityDate);
    document.getElementById('validityTime').textContent = validityDisplay;
}

// Format time for display (DD Mon, YY | HH:MM AM/PM)
function formatDisplayTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${day} ${month}, ${year} | ${hoursStr}:${minutes} ${ampm}`;
}

// Save pass data to localStorage
function savePassData(name, bookingTime, passNumber) {
    const today = getCurrentDate();
    const data = {
        name: name,
        bookingTime: bookingTime,
        passNumber: passNumber,
        date: today
    };
    localStorage.setItem('rrlPassData', JSON.stringify(data));
}

// Setup event listeners
function setupEventListeners() {
    // Name input change
    document.getElementById('userName').addEventListener('input', function(e) {
        const name = e.target.value;
        const storedData = getStoredPassData();
        if (storedData) {
            storedData.name = name;
            localStorage.setItem('rrlPassData', JSON.stringify(storedData));
        }
    });
    
    // Booking time change
    document.getElementById('bookingTime').addEventListener('change', function(e) {
        const newBookingTime = e.target.value;
        const newBookingDate = new Date(newBookingTime);
        const storedData = getStoredPassData();
        
        // Check if date changed (regenerate pass number)
        const oldDate = storedData ? storedData.bookingTime.split('T')[0] : null;
        const newDate = newBookingTime.split('T')[0];
        
        if (oldDate !== newDate) {
            // Date changed - generate new pass number
            const newPassNumber = generatePassNumber(newBookingDate);
            document.getElementById('passNumber').textContent = newPassNumber;
            savePassData(document.getElementById('userName').value, newBookingTime, newPassNumber);
        } else {
            // Same date - keep pass number, just update time
            savePassData(document.getElementById('userName').value, newBookingTime, storedData.passNumber);
        }
        
        updateDisplayedTimes(newBookingTime);
        
        // Restart countdown with new validity time
        startCountdown();
    });
}

// Start countdown timer
function startCountdown() {
    // Clear existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Get booking time value
    const bookingTimeValue = document.getElementById('bookingTime').value;
    if (!bookingTimeValue) return;
    
    const bookingDate = new Date(bookingTimeValue);
    
    // Create validity date for the SAME day as booking, at 11:59:59 PM
    const validityDate = new Date(bookingDate.getFullYear(), 
                                   bookingDate.getMonth(), 
                                   bookingDate.getDate(), 
                                   23, 59, 59, 999);
    
    // Function to update the display
    function updateTimer() {
        const now = new Date();
        const timeRemaining = validityDate - now;
        
        if (timeRemaining <= 0) {
            // Pass expired
            clearInterval(countdownInterval);
            document.getElementById('expiryTimer').textContent = 'Expired';
            
            // Check if it's today and auto-regenerate
            const today = getCurrentDate();
            const bookingDateStr = bookingDate.toISOString().split('T')[0];
            if (bookingDateStr === today) {
                localStorage.removeItem('rrlPassData');
                setTimeout(generateNewPass, 1000);
            }
        } else {
            // Calculate hours, minutes, seconds
            const totalSeconds = Math.floor(timeRemaining / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            const hoursStr = String(hours).padStart(2, '0');
            const minutesStr = String(minutes).padStart(2, '0');
            const secondsStr = String(seconds).padStart(2, '0');
            
            document.getElementById('expiryTimer').textContent = 
                `Expires in ${hoursStr}:${minutesStr}:${secondsStr}`;
        }
    }
    
    // Update immediately
    updateTimer();
    
    // Update countdown every second
    countdownInterval = setInterval(updateTimer, 1000);
}

// Close app function (placeholder)
function closeApp() {
    // For web-to-app platforms, this might trigger app close
    // For now, just show an alert
    if (confirm('Close the app?')) {
        window.close();
    }
}
