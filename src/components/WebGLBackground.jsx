import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

export default function WebGLBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    let width = mountRef.current.clientWidth
    let height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 45

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.IcosahedronGeometry(18, 12) 
    const material = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x2dd4bf, // Teal-400
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })
    
    const particles = new THREE.Points(geometry, material)
    
    particles.position.x = 0
    
    scene.add(particles)

    const mouse = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }

    const handleMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      
      gsap.to(target, {
        x: mouse.x,
        y: mouse.y,
        duration: 3, // Silky smooth lag
        ease: 'power3.out'
      })
    }
    window.addEventListener('mousemove', handleMouseMove)

    let time = 0
    const tick = () => {
      time += 0.0015 // Perpetual slow ambient rotation
      
      particles.rotation.y = time + (target.x * 0.8)
      particles.rotation.x = (target.y * 0.8)
      
      particles.position.y = Math.sin(time * 8) * 1.5
      
      renderer.render(scene, camera)
    }
    gsap.ticker.add(tick)

    const handleResize = () => {
      if (!mountRef.current) return
      width = mountRef.current.clientWidth
      height = mountRef.current.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      gsap.ticker.remove(tick)
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 1, 
        pointerEvents: 'none' // Let clicks pass through to text/branding
      }} 
    />
  )
}
