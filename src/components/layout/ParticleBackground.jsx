import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    // Data stream lines
    const streams = Array.from({ length: 8 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -100,
      vy: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.3 + 0.1,
      chars: Array.from({ length: 12 }, () => Math.random() > 0.5 ? '1' : '0'),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw data streams (matrix-style)
      ctx.font = '10px JetBrains Mono, monospace';
      streams.forEach(s => {
        s.y += s.vy;
        if (s.y > canvas.height + 200) {
          s.y = -200;
          s.x = Math.random() * canvas.width;
        }
        s.chars.forEach((c, i) => {
          const alpha = Math.max(0, s.alpha - i * 0.02);
          ctx.fillStyle = `rgba(30,144,255,${alpha})`;
          ctx.fillText(c, s.x, s.y - i * 12);
        });
      });

      // Draw particles with connections
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30,144,255,${p.alpha})`;
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(30,144,255,${(1 - dist / 120) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-bg" />;
}
