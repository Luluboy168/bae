document.addEventListener('DOMContentLoaded', () => {
    const noBtn = document.getElementById('no-btn');
    const yesBtn = document.getElementById('yes-btn');
    const question = document.getElementById('question');
    const pullRopeGif = document.getElementById('pull-rope-gif');

    // Configuration
    const moveDistance = 60; // Distance to move (Reduced for smaller hops)
    const maxChases = 15;
    let chaseCount = 0;
    let hasClickedNo = false;

    // Function to move the 'No' button
    function moveNoBtn(e) {
        // Check exhaustion
        if (chaseCount >= maxChases) {
            showTiredGif();
            return;
        }

        chaseCount++;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Get current position & dimensions
        const btnRect = noBtn.getBoundingClientRect();
        // Basic validation for btnRect
        if (isNaN(btnRect.width) || isNaN(btnRect.height) || btnRect.width === 0 || btnRect.height === 0) {
            console.warn("noBtn has invalid dimensions, skipping movement.");
            return;
        }
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        // Get cursor/touch position
        let cursorX, cursorY;
        if (e.type && e.type.includes('touch')) {
            if (e.touches && e.touches.length > 0) {
                cursorX = e.touches[0].clientX;
                cursorY = e.touches[0].clientY;
            } else {
                cursorX = btnCenterX;
                cursorY = btnCenterY;
            }
        } else if (e.clientX !== undefined) {
            cursorX = e.clientX;
            cursorY = e.clientY;
        } else {
            cursorX = btnCenterX;
            cursorY = btnCenterY;
        }

        // Calculate vector from cursor to button (Escape Vector)
        let deltaX = btnCenterX - cursorX;
        let deltaY = btnCenterY - cursorY;

        // Normalize and scale (ensure it moves AWAY)
        // If cursor is right on top or undefined, pick random direction
        if ((deltaX === 0 && deltaY === 0) || (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1)) {
            deltaX = (Math.random() - 0.5) * 10; // Ensure non-zero
            deltaY = (Math.random() - 0.5) * 10;
        }

        // WALL REPULSION
        // If we are close to a wall, add a strong vector component AWAY from the wall
        const edgeThreshold = 100; // Distance from edge to start repelling
        const repulsionStrength = 200; // Strength of repulsion
        const centerRepulsionStrength = 300; // Strength of repulsion from Yes button

        // Left Wall
        if (btnCenterX < edgeThreshold) {
            deltaX += repulsionStrength * (1 - btnCenterX / edgeThreshold);
        }
        // Right Wall
        if (btnCenterX > viewportWidth - edgeThreshold) {
            deltaX -= repulsionStrength * (1 - (viewportWidth - btnCenterX) / edgeThreshold);
        }
        // Top Wall
        if (btnCenterY < edgeThreshold) {
            deltaY += repulsionStrength * (1 - btnCenterY / edgeThreshold);
        }
        // Bottom Wall
        if (btnCenterY > viewportHeight - edgeThreshold) {
            deltaY -= repulsionStrength * (1 - (viewportHeight - btnCenterY) / edgeThreshold);
        }

        // YES BUTTON REPULSION (Avoid blocking)
        const yesRect = document.getElementById('yes-btn').getBoundingClientRect();
        const yesCenterX = yesRect.left + yesRect.width / 2;
        const yesCenterY = yesRect.top + yesRect.height / 2;

        const distToYesX = btnCenterX - yesCenterX;
        const distToYesY = btnCenterY - yesCenterY;
        const distToYes = Math.sqrt(distToYesX * distToYesX + distToYesY * distToYesY);
        const safeZone = 250; // Radius around Yes button to avoid

        if (distToYes < safeZone) {
            // Push away from Yes button
            // Normalize direction
            let undoX = distToYesX / (distToYes || 1);
            let undoY = distToYesY / (distToYes || 1);

            deltaX += undoX * centerRepulsionStrength * (1 - distToYes / safeZone);
            deltaY += undoY * centerRepulsionStrength * (1 - distToYes / safeZone);
        }

        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        // Avoid division by zero
        const safeLength = length > 0.1 ? length : 0.1;

        const scale = (moveDistance + Math.random() * 50) / safeLength;

        let moveX = deltaX * scale;
        let moveY = deltaY * scale;

        // Check for NaN or Infinity after calculation
        if (isNaN(moveX) || !isFinite(moveX)) moveX = (Math.random() - 0.5) * 100;
        if (isNaN(moveY) || !isFinite(moveY)) moveY = (Math.random() - 0.5) * 100;

        // Current positions
        // If not moving yet, initialize
        if (!noBtn.classList.contains('moving')) {
            noBtn.style.left = `${btnRect.left}px`;
            noBtn.style.top = `${btnRect.top}px`;
            noBtn.classList.add('moving');
        }

        let currentLeft = parseFloat(noBtn.style.left);
        let currentTop = parseFloat(noBtn.style.top);

        // Fallback if parseFloat failed (shouldn't if set above)
        if (isNaN(currentLeft)) currentLeft = btnRect.left;
        if (isNaN(currentTop)) currentTop = btnRect.top;

        let newLeft = currentLeft + moveX;
        let newTop = currentTop + moveY;

        // Boundary checks - Bounce/Clamp
        const padding = 50; // Increased padding to keep it well inside
        const maxLeft = viewportWidth - btnRect.width - padding;
        const maxTop = viewportHeight - btnRect.height - padding;

        // Clamp
        newLeft = Math.max(padding, Math.min(newLeft, maxLeft));
        newTop = Math.max(padding, Math.min(newTop, maxTop));

        // Update move vector after clamping for correct rotation
        const clampedMoveX = newLeft - currentLeft;
        const clampedMoveY = newTop - currentTop;

        // Apply new position
        noBtn.style.left = `${newLeft}px`;
        noBtn.style.top = `${newTop}px`;

        // Pull Rope Effect
        // Pass the effective movement vector
        showPullRope(newLeft, newTop, btnRect.width, btnRect.height, clampedMoveX, clampedMoveY);
    }

    function showPullRope(btnLeft, btnTop, btnWidth, btnHeight, deltaX, deltaY) {
        if (isNaN(deltaX) || isNaN(deltaY) || (!deltaX && !deltaY)) return; // Didn't move or invalid

        pullRopeGif.classList.remove('hidden');

        // Calculate Angle of movement
        let angleRad = Math.atan2(deltaY, deltaX);
        let angleDeg = angleRad * (180 / Math.PI);

        // Logic to keep penguin upright (feet down)
        // Penguin pulls from Right-to-Left natively (Left side of image).
        // Native Vector is 180 degrees.

        let rotation = 0;
        let scaleX = 1;

        if (Math.abs(angleDeg) > 90) {
            // Moving LEFT-ish (90 to 270 degrees / -90 to -180)
            // Native orientation is good.
            // Move Left (180) -> want 0 rotation.
            rotation = angleDeg - 180;
            scaleX = 1;
        } else {
            // Moving RIGHT-ish (-90 to 90 degrees)
            // Flip horizontal to face Right.
            // When flipped, "Forward" is 0 degrees.
            // Move Right (0) -> want 0 rotation.
            rotation = angleDeg;
            scaleX = -1;
        }

        // Position:
        // Centered around button + offset ahead
        const btnCenterX = btnLeft + btnWidth / 2;
        const btnCenterY = btnTop + btnHeight / 2;

        const offsetDist = 120;
        const gifCenterX = btnCenterX + Math.cos(angleRad) * offsetDist;
        const gifCenterY = btnCenterY + Math.sin(angleRad) * offsetDist;

        const gifWidth = 200;
        const gifHeight = 100;

        pullRopeGif.style.left = `${gifCenterX - gifWidth / 2}px`;
        pullRopeGif.style.top = `${gifCenterY - gifHeight / 2}px`;

        // Combine scale and rotate
        pullRopeGif.style.transform = `rotate(${rotation}deg) scaleX(${scaleX})`;

        // Clear previous timeout if any
        if (noBtn.pullTimeout) clearTimeout(noBtn.pullTimeout);

        noBtn.pullTimeout = setTimeout(() => {
            pullRopeGif.classList.add('hidden');
        }, 500);
    }

    function showTiredGif() {
        const tiredGif = document.getElementById('tired-gif');

        // FIX: The .card container has transforms/filters which create a new stacking context.
        // This causes position:fixed to be relative to the CARD, not the viewport.
        // We must move it to body to align with getBoundingClientRect coordinates.
        if (tiredGif.parentElement !== document.body) {
            document.body.appendChild(tiredGif);
        }

        const btnRect = noBtn.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Add the message text first to calculate dims
        let msg = document.getElementById('tired-msg');
        if (!msg) {
            msg = document.createElement('div');
            msg.id = 'tired-msg';
            msg.style.position = 'fixed';
            msg.style.color = '#590d22';
            msg.style.fontWeight = 'bold';
            msg.style.fontSize = '1.1rem'; // slightly larger
            msg.style.pointerEvents = 'none';
            msg.style.textAlign = 'center';
            msg.style.zIndex = '100';
            msg.style.width = '250px';
            msg.style.textShadow = '0 2px 5px rgba(255,255,255,0.8)';
            document.body.appendChild(msg);
        }

        if (!hasClickedNo) {
            msg.textContent = "I'm tired... I'll just let you click it";
        }

        tiredGif.classList.remove('hidden');

        // LAYOUT CALCULATION
        // Desired Stack:
        // [Message] (Top)
        // [GIF] (Middle)
        // [Button] (Bottom - implicitly, but we anchor to Yes button now)

        // Dimensions
        const gifWidth = 150;
        const gifHeight = 120; // Approx
        const msgHeight = 30;  // Approx
        const msgWidth = 250;
        const gap = 5;

        const yesRect = document.getElementById('yes-btn').getBoundingClientRect();
        // Anchor relative to SAD HAMSTER (Middle of screen)
        const hamsterImg = document.querySelector('.sad-hamster');

        let targetRect = yesRect; // Fallback to Yes button if hamster not found
        if (hamsterImg) {
            targetRect = hamsterImg.getBoundingClientRect();
        }

        // We want it to appear to the RIGHT of the hamster
        // Center of the "Ghost" position
        const ghostCenterX = targetRect.right + 20 + (gifWidth / 2); // 20px gap
        // Align bottom of penguin with bottom of hamster roughly
        const ghostTop = targetRect.bottom - gifHeight + 10;

        // GIF Position
        let gifTop = ghostTop;
        let gifLeft = ghostCenterX - gifWidth / 2;

        // Horizontal Clamp GIF
        if (gifLeft < 10) gifLeft = 10;
        if (gifLeft + gifWidth > viewportWidth - 10) gifLeft = viewportWidth - gifWidth - 10;

        // Apply GIF Position
        tiredGif.style.left = `${gifLeft}px`;
        tiredGif.style.top = `${gifTop}px`;

        // Message Position (Follows the ACTUAL No Button)
        // Button Center
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnTop = btnRect.top;

        let msgTop = btnTop - msgHeight - gap;

        // Boundary Check (Top Screen) for Message
        if (msgTop < 10) {
            // Flip stack to BOTTOM of button if top blocked
            msgTop = btnRect.bottom + gap;
        }

        // Horizontal Clamp Message
        let msgLeft = btnCenterX;
        if (msgLeft - msgWidth / 2 < 10) msgLeft = 10 + msgWidth / 2;
        if (msgLeft + msgWidth / 2 > viewportWidth - 10) msgLeft = viewportWidth - 10 - msgWidth / 2;

        // Apply Message Position
        msg.style.left = `${msgLeft}px`;
        msg.style.top = `${msgTop}px`;
        msg.style.transform = 'translateX(-50%)';

        // Optional: Change button style to look defeated
        noBtn.style.transform = "scale(0.95) rotate(5deg)";
        noBtn.style.opacity = "0.8";
        noBtn.style.cursor = "pointer";

        // Allow clicking No now (Changes text to confirm interaction)
        // We do NOT set onclick here anymore to avoid resetting/redefining it 60 times a second on hover.
        // The click listener is now defined globally below.
    }

    // --- CLICK HANDLER FOR NO BUTTON ---
    noBtn.addEventListener('click', (e) => {
        // If not tired yet, clinking it should just make it run away!
        // This covers accidental clicks or mobile taps that bypass hover.
        if (chaseCount < maxChases) {
            e.preventDefault(); // Stop default button behavior
            moveNoBtn(e);
            return;
        }

        // If we are here, we are TIRED (chaseCount >= maxChases)
        // Check if the user manages to click it, we count it.

        console.log("No button clicked. hasClickedNo:", hasClickedNo);

        if (hasClickedNo) {
            // Second Click - EAT IT!
            const eat1 = document.getElementById('eat1');
            const eat2 = document.getElementById('eat2');

            if (!eat1 || !eat2) {
                console.error("Eat images not found in DOM!");
                return;
            }

            // FIX: Move images to body to escape parent stacking contexts (transforms/backdrop-filter)
            // This ensures 'position: fixed' is truly relative to the viewport
            document.body.appendChild(eat1);
            document.body.appendChild(eat2);

            console.log("Starting eat animation...");

            // Position visuals over the button
            const rect = noBtn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2; // Center over button

            // Set positions and force high z-index
            // Use translate(-50%, -50%) to perfectly center regardless of image dimensions
            // User requested "right on top", so removing offset to center it perfectly.

            eat1.style.left = `${centerX}px`;
            eat1.style.top = `${centerY}px`;
            eat1.style.transform = 'translate(-50%, -50%)';
            eat1.style.zIndex = '9999';

            eat2.style.left = `${centerX}px`;
            eat2.style.top = `${centerY}px`;
            eat2.style.transform = 'translate(-50%, -50%)';
            eat2.style.zIndex = '9999';

            // Animation Sequence
            // 1. Show Open Mouth
            eat1.classList.remove('hidden');
            eat1.style.display = 'block'; // Force display

            noBtn.style.opacity = '0'; // Hide button instantly
            const tiredGif = document.getElementById('tired-gif'); // Get tiredGif here
            if (tiredGif) tiredGif.classList.add('hidden'); // Hide tired penguin

            // Temporary hide message during crunch? Or keep it? keeping it.
            // Actually previous code hid it: msg.style.opacity = '0';
            const msg = document.getElementById('tired-msg');
            if (msg) msg.style.opacity = '0';

            // 2. Crunch (timeout)
            // Increased delay to 500ms (0.5s) as requested
            setTimeout(() => {
                console.log("Crunch time!");
                eat1.classList.add('hidden');
                eat1.style.display = 'none';

                eat2.classList.remove('hidden');
                eat2.style.display = 'block';

                // Final State
                if (msg) {
                    msg.style.opacity = '1';
                    msg.textContent = "Just kidding, You can't reject!";
                }
                noBtn.style.display = 'none'; // Gone forever

                // Hide eat2 using setTimeout after 1s
                setTimeout(() => {
                    eat2.classList.add('hidden');
                    eat2.style.display = 'none';
                }, 1000);

            }, 500);

        } else {
            // First Click
            // Only allow "First Click" logic if we are actually tired (or close to it)
            // Or just allow it anytime they catch it? 
            // Logic: If they catch it, they deserve to trigger the sequence.

            console.log("First click registered.");
            hasClickedNo = true;

            // Ensure message exists if they caught it before 'tired' triggered (rare)
            let msg = document.getElementById('tired-msg');
            if (!msg) {
                // If msg doesn't exist, we need to create it or just show an alert?
                // showTiredGif creates it. 
                // If they click BEFORE maxChases, showTiredGif hasn't run.
                // Let's force showTiredGif to ensure UI setup.
                showTiredGif();
                msg = document.getElementById('tired-msg');
            }

            if (msg) msg.textContent = "You clicked No? 😢 But I love you...";
        }
    });

    // Run away on hover (desktop)
    noBtn.addEventListener('mouseenter', (e) => moveNoBtn(e));

    // Run away on touch (mobile)
    noBtn.addEventListener('touchstart', (e) => {
        // Only prevent default if we're actually moving it, otherwise might block scrolling?
        // But for this button, we assume it's interaction
        e.preventDefault();
        moveNoBtn(e);
    });

    // Celebration on 'Yes' click
    yesBtn.addEventListener('click', () => {
        question.textContent = "I knew you would say YES! ❤️";

        // Confetti explosion
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff4d6d', '#ff8fa3', '#ffffff']
        });

        // Continuous confetti
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        noBtn.style.display = 'none';
        pullRopeGif.style.display = 'none';
        yesBtn.textContent = "❤️";
    });
});
