#!/usr/bin/env python3
"""
Script para crear favicons PNG de diferentes tamaños desde el SVG
"""
try:
    from PIL import Image, ImageDraw
    import math
    
    # Crear diferentes tamaños de favicon
    sizes = [16, 32, 48, 64, 128, 256]
    
    for size in sizes:
        # Crear imagen con fondo transparente
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Dibujar círculo con gradiente azul
        center = size // 2
        radius = int(size * 0.48)
        
        # Círculo de fondo
        draw.ellipse(
            [(center - radius, center - radius), (center + radius, center + radius)],
            fill=(30, 64, 175, 255),  # Azul del gradiente
            outline=(255, 255, 255, 255),
            width=max(1, size // 40)
        )
        
        # Línea de tendencia alcista (simplificada)
        line_width = max(2, size // 25)
        points = [
            (int(size * 0.2), int(size * 0.7)),
            (int(size * 0.35), int(size * 0.55)),
            (int(size * 0.5), int(size * 0.6)),
            (int(size * 0.65), int(size * 0.35)),
            (int(size * 0.8), int(size * 0.3))
        ]
        
        for i in range(len(points) - 1):
            draw.line([points[i], points[i + 1]], fill=(255, 255, 255, 255), width=line_width)
        
        # Puntos de datos
        point_radius = max(2, size // 30)
        for i, point in enumerate(points):
            color = (16, 185, 129, 255) if i != 2 else (245, 158, 11, 255)  # Verde o amarillo
            draw.ellipse(
                [(point[0] - point_radius, point[1] - point_radius),
                 (point[0] + point_radius, point[1] + point_radius)],
                fill=color
            )
        
        # Guardar
        img.save(f'public/favicon-{size}x{size}.png', 'PNG')
        print(f'✓ Creado favicon-{size}x{size}.png')
    
    print('\n✅ Todos los favicons PNG creados exitosamente!')
    print('\nPara ver los cambios:')
    print('1. Recarga el navegador con Ctrl+F5 (recarga forzada)')
    print('2. O limpia el cache del navegador')
    
except ImportError:
    print('❌ Error: PIL/Pillow no está instalado')
    print('\nInstala Pillow con:')
    print('  pip install Pillow')
    print('\nLuego ejecuta este script de nuevo.')
except Exception as e:
    print(f'❌ Error: {e}')
