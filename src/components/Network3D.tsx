import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface NetworkNode3D {
  id: string;
  name: string;
  type: string;
  metric: string;
  status: string;
  pos: THREE.Vector3;
  mesh?: THREE.Mesh;
}

interface Network3DProps {
  onHoverNode: (node: { name: string; type: string; metric: string; status: string; x: number; y: number } | null) => void;
}

export default function Network3D({ onHoverNode }: Network3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for user instructions
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 16);

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xe2e8f0, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 3);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 4, 30);
    pointLight.position.set(-5, -3, 5);
    scene.add(pointLight);

    // --- Create Network Nodes ---
    const nodesData: NetworkNode3D[] = [
      { id: '1', name: 'Nairobi Central Spine', type: 'Solar Core', metric: '10 Gbps active trunk', status: 'Optimal', pos: new THREE.Vector3(-4, 2, 1) },
      { id: '2', name: 'Mombasa Ocean Feed', type: 'Fiber Subsea Terminal', metric: '40 Gbps Ultra-Low Latency', status: 'Optimal', pos: new THREE.Vector3(4, -1, 2) },
      { id: '3', name: 'Kisumu Eco Relay', type: 'Solar-Powered Node', metric: '1 Gbps Green Power', status: 'Optimal', pos: new THREE.Vector3(-2, -3, 0) },
      { id: '4', name: 'Eldoret Hub Alpha', type: 'Backbone Repeater', metric: '2.5 Gbps active load', status: 'Optimal', pos: new THREE.Vector3(-1, 3, -2) },
      { id: '5', name: 'Nakuru Bio Node', type: 'Green Hub', metric: '1.2 Gbps active connection', status: 'Optimal', pos: new THREE.Vector3(1, 1, 3) },
      { id: '6', name: 'Thika Micro Relay', type: 'Solar-Powered Node', metric: '800 Mbps Eco Power', status: 'Optimal', pos: new THREE.Vector3(2, 3, -1) },
      { id: '7', name: 'Machakos Link C', type: 'Core Router', metric: '1.8 Gbps active load', status: 'Optimal', pos: new THREE.Vector3(3, -3, -2) },
      { id: '8', name: 'Naivasha Geo Node', type: 'Geothermal Backed Relay', metric: '5 Gbps active trunk', status: 'Optimal', pos: new THREE.Vector3(-3, -1, -3) },
    ];

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    // Create Visual Meshes for Nodes
    const nodeGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const glowGeometry = new THREE.SphereGeometry(0.55, 16, 16);

    nodesData.forEach((node) => {
      const nodeObj = new THREE.Group();
      nodeObj.position.copy(node.pos);

      // Core sphere
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x10b981, // Kijani Green
      });
      const coreMesh = new THREE.Mesh(nodeGeometry, coreMat);
      nodeObj.add(coreMesh);

      // Outer glow sphere
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMat);
      nodeObj.add(glowMesh);

      // Store visual reference for raycasting
      coreMesh.userData = { nodeId: node.id };
      node.mesh = coreMesh;

      nodesGroup.add(nodeObj);
    });

    // --- Create Network Edges (Connections) ---
    const connections: [number, number][] = [
      [0, 3], [0, 4], [0, 7],
      [1, 4], [1, 6], [1, 2],
      [2, 4], [2, 7],
      [3, 7], [3, 4],
      [5, 0], [5, 1], [5, 3]
    ];

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8, // Slate 400
      transparent: true,
      opacity: 0.6,
    });

    const edgeGroup = new THREE.Group();
    scene.add(edgeGroup);

    connections.forEach(([i, j]) => {
      const start = nodesData[i].pos;
      const end = nodesData[j].pos;

      const points = [start, end];
      const edgeGeom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(edgeGeom, edgeMaterial);
      edgeGroup.add(line);
    });

    // --- Flowing Data Photons ---
    const photonGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const photonMaterial = new THREE.MeshBasicMaterial({
      color: 0x34d399, // Bright Mint Green
      transparent: true,
      opacity: 0.9,
    });

    interface Photon {
      mesh: THREE.Mesh;
      startIndex: number;
      endIndex: number;
      progress: number;
      speed: number;
    }

    const photons: Photon[] = [];
    const maxPhotons = 12;

    for (let p = 0; p < maxPhotons; p++) {
      const mesh = new THREE.Mesh(photonGeometry, photonMaterial.clone());
      scene.add(mesh);

      // Random connection
      const connIndex = Math.floor(Math.random() * connections.length);
      const [startIndex, endIndex] = connections[connIndex];

      photons.push({
        mesh,
        startIndex,
        endIndex,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.008,
      });
    }

    // --- Orbit & Drag Logic ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotateX = -0.1;
    let rotateY = 0.2;
    let targetRotateX = -0.1;
    let targetRotateY = 0.2;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      // Calculate raycast for hover tooltip
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // Gather meshes to test
      const targets = nodesData.map(n => n.mesh).filter((m): m is THREE.Mesh => !!m);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object as THREE.Mesh;
        const nodeId = hoveredMesh.userData.nodeId;
        const hoveredNode = nodesData.find(n => n.id === nodeId);

        if (hoveredNode) {
          // Highlight
          (hoveredMesh.material as THREE.MeshBasicMaterial).color.setHex(0x34d399);
          hoveredMesh.scale.set(1.5, 1.5, 1.5);

          // Get screen coordinates for tooltip placement
          const vector = hoveredNode.pos.clone();
          vector.applyMatrix4(nodesGroup.matrixWorld); // Apply rotation
          vector.project(camera);

          const screenX = (vector.x * .5 + .5) * rect.width + rect.left;
          const screenY = (-(vector.y * .5) + .5) * rect.height + rect.top;

          onHoverNode({
            name: hoveredNode.name,
            type: hoveredNode.type,
            metric: hoveredNode.metric,
            status: hoveredNode.status,
            x: screenX,
            y: screenY,
          });
        }
      } else {
        // Reset node styles
        nodesData.forEach(n => {
          if (n.mesh) {
            (n.mesh.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
            n.mesh.scale.set(1, 1, 1);
          }
        });
        onHoverNode(null);
      }

      if (!isDragging) return;

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      targetRotateY += deltaX * 0.005;
      targetRotateX += deltaY * 0.005;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsInteracting(true);
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;

      targetRotateY += deltaX * 0.008;
      targetRotateX += deltaY * 0.008;

      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onMouseUp);

    // --- Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth rotation with easing
      rotateX += (targetRotateX - rotateX) * 0.1;
      rotateY += (targetRotateY - rotateY) * 0.1;

      // Add gentle constant rotation if not interacting
      if (!isDragging) {
        targetRotateY += 0.001;
        targetRotateX = -0.1 + Math.sin(time * 0.2) * 0.05;
      }

      nodesGroup.rotation.x = rotateX;
      nodesGroup.rotation.y = rotateY;
      edgeGroup.rotation.x = rotateX;
      edgeGroup.rotation.y = rotateY;

      // Pulsate glow of nodes
      nodesGroup.children.forEach((group) => {
        const glow = group.children[1] as THREE.Mesh;
        if (glow) {
          glow.scale.setScalar(1 + Math.sin(time * 3) * 0.15);
        }
      });

      // Animate flowing data photons
      photons.forEach((photon) => {
        photon.progress += photon.speed;
        
        if (photon.progress >= 1.0) {
          // Recycle photon to a new random edge
          photon.progress = 0;
          const connIndex = Math.floor(Math.random() * connections.length);
          photon.startIndex = connections[connIndex][0];
          photon.endIndex = connections[connIndex][1];
          photon.speed = 0.004 + Math.random() * 0.008;
        }

        const startNode = nodesData[photon.startIndex];
        const endNode = nodesData[photon.endIndex];

        if (startNode && endNode) {
          // Calculate active 3D position along the connection line
          const currentPos = new THREE.Vector3().lerpVectors(
            startNode.pos,
            endNode.pos,
            photon.progress
          );

          // Apply node group rotation to match visual space
          currentPos.applyEuler(nodesGroup.rotation);
          photon.mesh.position.copy(currentPos);

          // Pulsate photon opacity
          const mat = photon.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5 + Math.sin(time * 10 + photon.progress * 5) * 0.4;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onMouseUp);
      
      // Dispose materials & geometries
      nodeGeometry.dispose();
      glowGeometry.dispose();
      photonGeometry.dispose();
      edgeMaterial.dispose();
      photonMaterial.dispose();
      renderer.dispose();
    };
  }, [onHoverNode]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] md:min-h-[550px] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      
      {/* Visual background atmospheric radial gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
      
      {/* 3D Canvas Interaction Guide */}
      <div className="absolute bottom-4 left-4 pointer-events-none bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] text-[#10b981] font-mono shadow-md">
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"></span>
        </span>
        Drag to rotate. Hover nodes to view status.
      </div>
    </div>
  );
}
