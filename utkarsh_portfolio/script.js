/* ==========================================================================
   Utkarsh Patange Portfolio - Interactive JavaScript
   Includes background canvas node simulation, live A* pathfinder widget,
   scroll spy, mobile sidebar navigation, and copy/form actions.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------------------
       1. BACKGROUND CANVAS ANIMATION (Nodes, Particles & Cyber Connections)
       ---------------------------------------------------------------------- */
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(width * 0.04), 65);

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.6;
            this.vy = (Math.random() - 0.5) * 0.6;
            this.radius = Math.random() * 1.8 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    let mouse = { x: null, y: null, maxDist: 150 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function animateBackground() {
        ctx.clearRect(0, 0, width, height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            // Mouse interact
            if (mouse.x !== null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.maxDist) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 * (1 - dist / mouse.maxDist)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animateBackground);
    }
    animateBackground();


    /* ----------------------------------------------------------------------
       2. LIVE A* PATHFINDING GRID SIMULATOR DEMO
       ---------------------------------------------------------------------- */
    const gridContainer = document.getElementById('astar-grid');
    const runBtn = document.getElementById('run-astar-btn');

    const COLS = 12;
    const ROWS = 7;
    let grid = [];
    const startPos = { r: 1, c: 1 };
    const endPos = { r: 5, c: 10 };

    // Fixed obstacle locations for neat visual pathing
    const obstacles = [
        { r: 0, c: 4 }, { r: 1, c: 4 }, { r: 2, c: 4 }, { r: 3, c: 4 },
        { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }
    ];

    function createGrid() {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';
        grid = [];

        for (let r = 0; r < ROWS; r++) {
            grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.r = r;
                cell.dataset.c = c;

                const isStart = r === startPos.r && c === startPos.c;
                const isEnd = r === endPos.r && c === endPos.c;
                const isWall = obstacles.some(o => o.r === r && o.c === c);

                if (isStart) cell.classList.add('start');
                else if (isEnd) cell.classList.add('end');
                else if (isWall) cell.classList.add('wall');

                gridContainer.appendChild(cell);
                grid[r][c] = { r, c, isStart, isEnd, isWall, element: cell };
            }
        }
    }

    createGrid();

    // A* Pathfinding Logic for Demo Widget
    let isPathfindingRunning = false;

    async function runAStarDemo() {
        if (isPathfindingRunning) return;
        isPathfindingRunning = true;
        runBtn.disabled = true;
        runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating...';

        // Clear previous path/visited
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('visited', 'path');
        });

        // Simple BFS / A* Simulation for visual display
        const queue = [{ r: startPos.r, c: startPos.c, path: [] }];
        const visited = new Set();
        visited.add(`${startPos.r},${startPos.c}`);

        let finalPath = null;

        while (queue.length > 0) {
            const { r, c, path } = queue.shift();
            const currentPath = [...path, { r, c }];

            if (r === endPos.r && c === endPos.c) {
                finalPath = currentPath;
                break;
            }

            if (!(r === startPos.r && c === startPos.c) && !(r === endPos.r && c === endPos.c)) {
                const cellEl = grid[r][c].element;
                cellEl.classList.add('visited');
                await new Promise(res => setTimeout(res, 25)); // Visual delay
            }

            // Neighbors (Up, Right, Down, Left)
            const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
            for (let [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;

                if (
                    nr >= 0 && nr < ROWS &&
                    nc >= 0 && nc < COLS &&
                    !grid[nr][nc].isWall &&
                    !visited.has(key)
                ) {
                    visited.add(key);
                    queue.push({ r: nr, c: nc, path: currentPath });
                }
            }
        }

        // Highlight final path
        if (finalPath) {
            for (let p of finalPath) {
                if (!(p.r === startPos.r && p.c === startPos.c) && !(p.r === endPos.r && p.c === endPos.c)) {
                    grid[p.r][p.c].element.classList.remove('visited');
                    grid[p.r][p.c].element.classList.add('path');
                    await new Promise(res => setTimeout(res, 40));
                }
            }
        }

        runBtn.disabled = false;
        runBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reset & Re-run';
        isPathfindingRunning = false;
    }

    if (runBtn) {
        runBtn.addEventListener('click', runAStarDemo);
    }


    /* ----------------------------------------------------------------------
       3. MOBILE SIDEBAR NAVIGATION TOGGLE
       ---------------------------------------------------------------------- */
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking links on mobile
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 868) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }


    /* ----------------------------------------------------------------------
       4. SCROLL SPY FOR ACTIVE NAVIGATION LINK HIGHLIGHTING
       ---------------------------------------------------------------------- */
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

    function scrollSpy() {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', scrollSpy);


    /* ----------------------------------------------------------------------
       5. COPY CONTACT DETAILS TO CLIPBOARD
       ---------------------------------------------------------------------- */
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const textToCopy = btn.getAttribute('data-copy');
            if (!textToCopy) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalIcon = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                btn.style.background = '#22c55e';
                btn.style.color = '#0f172a';

                setTimeout(() => {
                    btn.innerHTML = originalIcon;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            });
        });
    });


    /* ----------------------------------------------------------------------
       6. CONTACT FORM INTERACTIVE FEEDBACK
       ---------------------------------------------------------------------- */
    const contactForm = document.getElementById('contact-form');
    const formToast = document.getElementById('form-toast');

    if (contactForm && formToast) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Show success toast
            formToast.classList.add('active');
            contactForm.reset();

            setTimeout(() => {
                formToast.classList.remove('active');
            }, 5000);
        });
    }
});
