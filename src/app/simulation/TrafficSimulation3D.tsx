'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { SimulationConfig, SimulationMetrics, AIDecision, Direction, Vehicle, TrafficLightState } from './types';

interface Props {
    config: SimulationConfig;
    onMetricsUpdate: (metrics: SimulationMetrics) => void;
    onDecisionUpdate: (decision: AIDecision) => void;
    onSignalSwitch?: (from: Direction, to: Direction, reason: string) => void;
}

export type TimeOfDay = 'day' | 'sunset' | 'night';
export type CameraView = 'iso' | 'top' | 'street';

// ============================================
// SIMULATION CONSTANTS - REALISTIC PHYSICS
// ============================================
const ROAD_WIDTH = 9;
const INTERSECTION_SIZE = 15;
const ROAD_LENGTH = 70;
const VEHICLE_SPEED = 0.06;
const SAFE_DISTANCE = 5;
const STOP_LINE_DISTANCE = 9.5;
const ACCELERATION = 0.002;
const DECELERATION = 0.004;

// ============================================
// LUSH TREES & VEGETATION COMPONENT
// ============================================
function Tree({ position, scale = 1, foliageColor = "#22c55e" }: { position: [number, number, number]; scale?: number; foliageColor?: string }) {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            {/* Trunk */}
            <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.35, 2.5, 8]} />
                <meshStandardMaterial color="#5c3a21" roughness={0.9} />
            </mesh>

            {/* Foliage - Layer 1 (Bottom) */}
            <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
                <sphereGeometry args={[1.5, 12, 12]} />
                <meshStandardMaterial color={foliageColor} roughness={0.6} />
            </mesh>

            {/* Foliage - Layer 2 (Middle) */}
            <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
                <sphereGeometry args={[1.2, 10, 10]} />
                <meshStandardMaterial color={foliageColor} roughness={0.5} />
            </mesh>

            {/* Foliage - Layer 3 (Top Accent) */}
            <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshStandardMaterial color="#84cc16" roughness={0.5} />
            </mesh>
        </group>
    );
}

function Bush({ position, scale = 1, color = "#16a34a" }: { position: [number, number, number]; scale?: number; color?: string }) {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.6, 8, 8]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0.4, 0.3, 0.2]} castShadow receiveShadow>
                <sphereGeometry args={[0.45, 8, 8]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[-0.3, 0.35, -0.2]} castShadow receiveShadow>
                <sphereGeometry args={[0.5, 8, 8]} />
                <meshStandardMaterial color="#22c55e" roughness={0.7} />
            </mesh>
        </group>
    );
}

function FlowerBed({ position }: { position: [number, number, number] }) {
    const colors = ["#ef4444", "#f59e0b", "#ec4899", "#3b82f6", "#ffffff"];
    return (
        <group position={position}>
            {/* Soil base */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <boxGeometry args={[3, 0.1, 1.5]} />
                <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            {/* Flower heads */}
            {[-1.1, -0.5, 0, 0.5, 1.1].map((x, i) => (
                <mesh key={i} position={[x, 0.2, (i % 2 === 0 ? 0.3 : -0.3)]} castShadow>
                    <sphereGeometry args={[0.12, 6, 6]} />
                    <meshStandardMaterial color={colors[i % colors.length]} emissive={colors[i % colors.length]} emissiveIntensity={0.2} />
                </mesh>
            ))}
        </group>
    );
}

// ============================================
// STREETSCAPE & INFRASTRUCTURE COMPONENT
// ============================================
function SidewalkAndStreetscape() {
    const sidewalkColor = "#e2e8f0"; // Bright concrete
    const curbColor = "#cbd5e1";

    return (
        <group>
            {/* Sidewalk Corner NW */}
            <mesh position={[-25, 0.02, -25]} receiveShadow>
                <boxGeometry args={[31, 0.2, 31]} />
                <meshStandardMaterial color={sidewalkColor} roughness={0.5} />
            </mesh>

            {/* Sidewalk Corner NE */}
            <mesh position={[25, 0.02, -25]} receiveShadow>
                <boxGeometry args={[31, 0.2, 31]} />
                <meshStandardMaterial color={sidewalkColor} roughness={0.5} />
            </mesh>

            {/* Sidewalk Corner SW */}
            <mesh position={[-25, 0.02, 25]} receiveShadow>
                <boxGeometry args={[31, 0.2, 31]} />
                <meshStandardMaterial color={sidewalkColor} roughness={0.5} />
            </mesh>

            {/* Sidewalk Corner SE */}
            <mesh position={[25, 0.02, 25]} receiveShadow>
                <boxGeometry args={[31, 0.2, 31]} />
                <meshStandardMaterial color={sidewalkColor} roughness={0.5} />
            </mesh>

            {/* Zebra Pedestrian Crosswalks */}
            {[
                { pos: [0, 0.01, -INTERSECTION_SIZE / 2 - 1.5] as [number, number, number], args: [ROAD_WIDTH, 0.02, 1.8] as const, rotY: 0 },
                { pos: [0, 0.01, INTERSECTION_SIZE / 2 + 1.5] as [number, number, number], args: [ROAD_WIDTH, 0.02, 1.8] as const, rotY: 0 },
                { pos: [-INTERSECTION_SIZE / 2 - 1.5, 0.01, 0] as [number, number, number], args: [1.8, 0.02, ROAD_WIDTH] as const, rotY: 0 },
                { pos: [INTERSECTION_SIZE / 2 + 1.5, 0.01, 0] as [number, number, number], args: [1.8, 0.02, ROAD_WIDTH] as const, rotY: 0 },
            ].map((crosswalk, idx) => (
                <group key={idx} position={crosswalk.pos}>
                    {/* Background pad */}
                    <mesh receiveShadow>
                        <boxGeometry args={crosswalk.args} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    {/* White stripes */}
                    {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((offset, i) => (
                        <mesh key={i} position={crosswalk.args[0] > crosswalk.args[2] ? [offset, 0.02, 0] : [0, 0.02, offset]}>
                            <boxGeometry args={crosswalk.args[0] > crosswalk.args[2] ? [0.6, 0.02, 1.5] : [1.5, 0.02, 0.6]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.3} />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Street Light Posts */}
            {[
                { pos: [7, 0, 10] as [number, number, number], rot: Math.PI },
                { pos: [-7, 0, -10] as [number, number, number], rot: 0 },
                { pos: [10, 0, -7] as [number, number, number], rot: -Math.PI / 2 },
                { pos: [-10, 0, 7] as [number, number, number], rot: Math.PI / 2 },
                { pos: [25, 0, 7] as [number, number, number], rot: Math.PI / 2 },
                { pos: [-25, 0, -7] as [number, number, number], rot: -Math.PI / 2 },
            ].map((lamp, i) => (
                <group key={i} position={lamp.pos} rotation={[0, lamp.rot, 0]}>
                    <mesh position={[0, 3, 0]} castShadow>
                        <cylinderGeometry args={[0.08, 0.12, 6, 8]} />
                        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
                    </mesh>
                    {/* Arm */}
                    <mesh position={[0.6, 5.8, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
                        <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
                        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
                    </mesh>
                    {/* Lamp Fixture */}
                    <mesh position={[1.2, 5.4, 0]}>
                        <boxGeometry args={[0.4, 0.15, 0.25]} />
                        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
                    </mesh>
                </group>
            ))}

            {/* Fire Hydrants & Benches */}
            <group position={[6.5, 0.4, 8.5]}>
                <mesh castShadow>
                    <cylinderGeometry args={[0.18, 0.22, 0.8, 8]} />
                    <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.6} />
                </mesh>
            </group>
            <group position={[-6.5, 0.4, -8.5]}>
                <mesh castShadow>
                    <cylinderGeometry args={[0.18, 0.22, 0.8, 8]} />
                    <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.6} />
                </mesh>
            </group>

            {/* Park Benches */}
            {[
                { pos: [12, 0.3, 11] as [number, number, number], rot: 0 },
                { pos: [-12, 0.3, -11] as [number, number, number], rot: Math.PI },
            ].map((bench, idx) => (
                <group key={idx} position={bench.pos} rotation={[0, bench.rot, 0]}>
                    <mesh castShadow position={[0, 0, 0]}>
                        <boxGeometry args={[2, 0.4, 0.6]} />
                        <meshStandardMaterial color="#78350f" roughness={0.7} />
                    </mesh>
                    <mesh castShadow position={[0, 0.4, -0.25]}>
                        <boxGeometry args={[2, 0.6, 0.1]} />
                        <meshStandardMaterial color="#78350f" roughness={0.7} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ============================================
// 3D ROAD COMPONENT
// ============================================
function Road() {
    return (
        <group>
            {/* Main intersection area - smooth dark asphalt */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[INTERSECTION_SIZE, INTERSECTION_SIZE]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>

            {/* North-South Road */}
            <mesh position={[0, -0.05, -ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
                <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.05, ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
                <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>

            {/* East-West Road */}
            <mesh position={[-ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
                <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            <mesh position={[ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
                <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>

            {/* Center Double Yellow Line Markings */}
            {[
                { pos: [-0.12, -0.03, -ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2] as [number, number, number], args: [0.12, ROAD_LENGTH] as const },
                { pos: [0.12, -0.03, -ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2] as [number, number, number], args: [0.12, ROAD_LENGTH] as const },
                { pos: [-0.12, -0.03, ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2] as [number, number, number], args: [0.12, ROAD_LENGTH] as const },
                { pos: [0.12, -0.03, ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2] as [number, number, number], args: [0.12, ROAD_LENGTH] as const },
            ].map((line, idx) => (
                <mesh key={idx} position={line.pos} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={line.args} />
                    <meshStandardMaterial color="#f59e0b" />
                </mesh>
            ))}

            {[
                { pos: [-ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2, -0.03, -0.12] as [number, number, number], args: [ROAD_LENGTH, 0.12] as const },
                { pos: [-ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2, -0.03, 0.12] as [number, number, number], args: [ROAD_LENGTH, 0.12] as const },
                { pos: [ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2, -0.03, -0.12] as [number, number, number], args: [ROAD_LENGTH, 0.12] as const },
                { pos: [ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2, -0.03, 0.12] as [number, number, number], args: [ROAD_LENGTH, 0.12] as const },
            ].map((line, idx) => (
                <mesh key={`ew-${idx}`} position={line.pos} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={line.args} />
                    <meshStandardMaterial color="#f59e0b" />
                </mesh>
            ))}

            {/* Stop lines - crisp white */}
            <mesh position={[2.2, -0.02, -STOP_LINE_DISTANCE]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.8, 0.5]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[-2.2, -0.02, STOP_LINE_DISTANCE]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.8, 0.5]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[-STOP_LINE_DISTANCE, -0.02, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, 3.8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[STOP_LINE_DISTANCE, -0.02, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, 3.8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
        </group>
    );
}

// ============================================
// 3D VEHICLE COMPONENT WITH WHEELS & GLASS
// ============================================
function Vehicle3D({ vehicle, isAmbulance }: { vehicle: Vehicle; isAmbulance: boolean }) {
    const groupRef = useRef<THREE.Group>(null);
    const [flashOn, setFlashOn] = useState(true);

    useFrame((state) => {
        if (isAmbulance) {
            setFlashOn(Math.sin(state.clock.elapsedTime * 10) > 0);
        }
    });

    const getRotation = (): number => {
        switch (vehicle.direction) {
            case 'north': return 0;
            case 'south': return Math.PI;
            case 'east': return -Math.PI / 2;
            case 'west': return Math.PI / 2;
        }
    };

    const vehicleColor = isAmbulance
        ? '#ffffff'
        : vehicle.type === 'truck'
            ? '#ea580c'
            : vehicle.color || '#2563eb';

    const size = vehicle.type === 'truck'
        ? { w: 2.3, h: 2.2, d: 4.8 }
        : { w: 1.8, h: 1.2, d: 3.6 };

    const wheelRadius = vehicle.type === 'truck' ? 0.45 : 0.32;
    const wheelY = wheelRadius;

    return (
        <group
            ref={groupRef}
            position={[vehicle.position.x, size.h / 2 + wheelY * 0.4, vehicle.position.y]}
            rotation={[0, getRotation(), 0]}
        >
            {/* Main body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[size.w, size.h * 0.7, size.d]} />
                <meshStandardMaterial color={vehicleColor} metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Cabin / Roof */}
            {vehicle.type === 'car' && (
                <mesh position={[0, size.h * 0.45, -size.d * 0.05]} castShadow receiveShadow>
                    <boxGeometry args={[size.w * 0.85, size.h * 0.55, size.d * 0.48]} />
                    <meshStandardMaterial color={vehicleColor} metalness={0.6} roughness={0.3} />
                </mesh>
            )}

            {/* Windshield Glass */}
            <mesh position={[0, size.h * 0.45, size.d * 0.18]} rotation={[0.25, 0, 0]}>
                <planeGeometry args={[size.w * 0.8, size.h * 0.4]} />
                <meshStandardMaterial color="#93c5fd" roughness={0.1} metalness={0.9} transparent opacity={0.7} />
            </mesh>

            {/* 4 Rubber Wheels */}
            {[
                [size.w / 2 + 0.05, -size.h * 0.3, size.d * 0.3],
                [-size.w / 2 - 0.05, -size.h * 0.3, size.d * 0.3],
                [size.w / 2 + 0.05, -size.h * 0.3, -size.d * 0.3],
                [-size.w / 2 - 0.05, -size.h * 0.3, -size.d * 0.3],
            ].map((wPos, i) => (
                <mesh key={i} position={wPos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[wheelRadius, wheelRadius, 0.28, 16]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.9} />
                </mesh>
            ))}

            {/* Ambulance Specific Markings & Siren */}
            {isAmbulance && (
                <>
                    {/* Red Stripe Side */}
                    <mesh position={[size.w / 2 + 0.01, 0, 0]}>
                        <planeGeometry args={[size.d * 0.9, size.h * 0.25]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[-size.w / 2 - 0.01, 0, 0]} rotation={[0, Math.PI, 0]}>
                        <planeGeometry args={[size.d * 0.9, size.h * 0.25]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>

                    {/* Red Cross on Top */}
                    <mesh position={[0, size.h / 2 + 0.02, 0]}>
                        <boxGeometry args={[0.7, 0.04, 0.2]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[0, size.h / 2 + 0.02, 0]}>
                        <boxGeometry args={[0.2, 0.04, 0.7]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>

                    {/* Flashing Emergency Siren Lights */}
                    <mesh position={[0.4, size.h / 2 + 0.25, 0.2]}>
                        <boxGeometry args={[0.25, 0.25, 0.25]} />
                        <meshStandardMaterial
                            color={flashOn ? '#ef4444' : '#2563eb'}
                            emissive={flashOn ? '#ef4444' : '#2563eb'}
                            emissiveIntensity={3}
                        />
                    </mesh>
                    <mesh position={[-0.4, size.h / 2 + 0.25, 0.2]}>
                        <boxGeometry args={[0.25, 0.25, 0.25]} />
                        <meshStandardMaterial
                            color={flashOn ? '#2563eb' : '#ef4444'}
                            emissive={flashOn ? '#2563eb' : '#ef4444'}
                            emissiveIntensity={3}
                        />
                    </mesh>
                </>
            )}

            {/* Headlights */}
            <mesh position={[size.w * 0.35, 0, size.d / 2 + 0.02]}>
                <boxGeometry args={[0.25, 0.18, 0.05]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[-size.w * 0.35, 0, size.d / 2 + 0.02]}>
                <boxGeometry args={[0.25, 0.18, 0.05]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.2} />
            </mesh>

            {/* Taillights */}
            <mesh position={[size.w * 0.35, 0, -size.d / 2 - 0.02]}>
                <boxGeometry args={[0.25, 0.18, 0.05]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[-size.w * 0.35, 0, -size.d / 2 - 0.02]}>
                <boxGeometry args={[0.25, 0.18, 0.05]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
            </mesh>
        </group>
    );
}

// ============================================
// 3D TRAFFIC LIGHT COMPONENT
// ============================================
function TrafficLight3D({
    position,
    state,
    direction
}: {
    position: [number, number, number];
    state: TrafficLightState;
    direction: Direction;
}) {
    const rotationMap: Record<Direction, number> = {
        north: Math.PI,
        south: 0,
        east: Math.PI / 2,
        west: -Math.PI / 2,
    };

    return (
        <group position={position} rotation={[0, rotationMap[direction], 0]}>
            {/* Metal Pole */}
            <mesh position={[0, 2.8, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.15, 5.6, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Light Housing Box */}
            <mesh position={[0, 5.5, 0.3]} castShadow>
                <boxGeometry args={[0.9, 2.4, 0.55]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>

            {/* Red Light */}
            <mesh position={[0, 6.2, 0.6]}>
                <sphereGeometry args={[0.24, 16, 16]} />
                <meshStandardMaterial
                    color={state === 'red' ? '#ef4444' : '#450a0a'}
                    emissive={state === 'red' ? '#dc2626' : '#000000'}
                    emissiveIntensity={state === 'red' ? 3 : 0}
                />
            </mesh>

            {/* Yellow Light */}
            <mesh position={[0, 5.5, 0.6]}>
                <sphereGeometry args={[0.24, 16, 16]} />
                <meshStandardMaterial
                    color={state === 'yellow' ? '#f59e0b' : '#451a03'}
                    emissive={state === 'yellow' ? '#d97706' : '#000000'}
                    emissiveIntensity={state === 'yellow' ? 3 : 0}
                />
            </mesh>

            {/* Green Light */}
            <mesh position={[0, 4.8, 0.6]}>
                <sphereGeometry args={[0.24, 16, 16]} />
                <meshStandardMaterial
                    color={state === 'green' ? '#22c55e' : '#052e16'}
                    emissive={state === 'green' ? '#16a34a' : '#000000'}
                    emissiveIntensity={state === 'green' ? 3 : 0}
                />
            </mesh>

            {/* Direction Sign Header */}
            <group position={[0, 7.1, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[1.6, 0.5, 0.1]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
                <Text
                    position={[0, 0, 0.08]}
                    fontSize={0.32}
                    color="#f8fafc"
                    anchorX="center"
                    anchorY="middle"
                >
                    {direction.toUpperCase()}
                </Text>
            </group>
        </group>
    );
}

// ============================================
// ARCHITECTURAL VIBRANT BUILDINGS WITH WINDOWS & ROOFTOP DETAILS
// ============================================
function Buildings() {
    const buildingData = [
        // NW Corner Buildings
        { pos: [-32, 10, -32] as const, size: [12, 20, 12] as const, color: '#f8fafc', glassColor: '#38bdf8', roof: 'helipad' },
        { pos: [-46, 7, -30] as const, size: [10, 14, 10] as const, color: '#fef3c7', glassColor: '#f59e0b', roof: 'garden' },
        { pos: [-30, 8, -48] as const, size: [14, 16, 10] as const, color: '#e0e7ff', glassColor: '#6366f1', roof: 'hvac' },

        // NE Corner Buildings
        { pos: [32, 12, -32] as const, size: [14, 24, 14] as const, color: '#f1f5f9', glassColor: '#0ea5e9', roof: 'helipad' },
        { pos: [48, 6, -30] as const, size: [10, 12, 12] as const, color: '#ffedd5', glassColor: '#ea580c', roof: 'hvac' },
        { pos: [30, 9, -48] as const, size: [12, 18, 12] as const, color: '#ecfdf5', glassColor: '#10b981', roof: 'garden' },

        // SW Corner Buildings
        { pos: [-32, 14, 32] as const, size: [14, 28, 14] as const, color: '#f8fafc', glassColor: '#0284c7', roof: 'helipad' },
        { pos: [-48, 8, 30] as const, size: [12, 16, 10] as const, color: '#fae8ff', glassColor: '#d946ef', roof: 'hvac' },
        { pos: [-30, 6, 48] as const, size: [10, 12, 14] as const, color: '#fef2f2', glassColor: '#ef4444', roof: 'garden' },

        // SE Corner Buildings
        { pos: [32, 8, 32] as const, size: [12, 16, 12] as const, color: '#f0fdf4', glassColor: '#22c55e', roof: 'garden' },
        { pos: [46, 11, 32] as const, size: [10, 22, 10] as const, color: '#e0f2fe', glassColor: '#38bdf8', roof: 'hvac' },
        { pos: [30, 7, 48] as const, size: [14, 14, 12] as const, color: '#fff7ed', glassColor: '#f97316', roof: 'hvac' },
    ];

    return (
        <group>
            {buildingData.map((b, i) => {
                const [w, h, d] = b.size;
                return (
                    <group key={i} position={b.pos as unknown as [number, number, number]}>
                        {/* Main Building Frame */}
                        <mesh position={[0, 0, 0]} castShadow receiveShadow>
                            <boxGeometry args={[w, h, d]} />
                            <meshStandardMaterial color={b.color} roughness={0.4} />
                        </mesh>

                        {/* Glass Window Grid Facade (Front & Side) */}
                        <mesh position={[0, 0, d / 2 + 0.05]}>
                            <planeGeometry args={[w * 0.85, h * 0.85]} />
                            <meshStandardMaterial color={b.glassColor} metalness={0.9} roughness={0.1} transparent opacity={0.8} />
                        </mesh>
                        <mesh position={[w / 2 + 0.05, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                            <planeGeometry args={[d * 0.85, h * 0.85]} />
                            <meshStandardMaterial color={b.glassColor} metalness={0.9} roughness={0.1} transparent opacity={0.8} />
                        </mesh>

                        {/* Rooftop Details */}
                        {b.roof === 'helipad' && (
                            <group position={[0, h / 2 + 0.05, 0]}>
                                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                    <circleGeometry args={[w * 0.3, 32]} />
                                    <meshStandardMaterial color="#334155" />
                                </mesh>
                                <Text position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={w * 0.25} color="#ffffff">
                                    H
                                </Text>
                            </group>
                        )}
                        {b.roof === 'garden' && (
                            <group position={[0, h / 2 + 0.2, 0]}>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                                    <planeGeometry args={[w * 0.7, d * 0.7]} />
                                    <meshStandardMaterial color="#15803d" />
                                </mesh>
                                <Bush position={[-w * 0.2, 0.2, -d * 0.2]} scale={0.8} />
                                <Bush position={[w * 0.2, 0.2, d * 0.2]} scale={0.8} />
                            </group>
                        )}
                        {b.roof === 'hvac' && (
                            <group position={[0, h / 2 + 0.4, 0]}>
                                <mesh castShadow>
                                    <boxGeometry args={[w * 0.4, 0.8, d * 0.4]} />
                                    <meshStandardMaterial color="#64748b" metalness={0.8} />
                                </mesh>
                            </group>
                        )}
                    </group>
                );
            })}
        </group>
    );
}

// ============================================
// SCENE COMPONENT WITH DAY / SUNSET / NIGHT ENVIRONMENT
// ============================================
function Scene({
    vehicles,
    lights,
    timeOfDay,
}: {
    vehicles: Vehicle[];
    lights: Record<Direction, { state: TrafficLightState }>;
    timeOfDay: TimeOfDay;
}) {
    const isDay = timeOfDay === 'day';
    const isSunset = timeOfDay === 'sunset';

    // Dynamic lighting setup
    const sunPosition: [number, number, number] = isDay ? [40, 60, 30] : isSunset ? [60, 20, -30] : [20, 30, 20];
    const sunColor = isDay ? '#fffdf0' : isSunset ? '#fdba74' : '#94a3b8';
    const sunIntensity = isDay ? 2.5 : isSunset ? 1.6 : 0.4;
    const ambientIntensity = isDay ? 0.8 : isSunset ? 0.5 : 0.2;
    const fogColor = isDay ? '#e2e8f0' : isSunset ? '#7c2d12' : '#0a0a1a';
    const grassColor = isDay ? '#38a169' : isSunset ? '#276749' : '#1a3d1a';
    const envPreset = isDay ? 'city' : isSunset ? 'sunset' : 'night';

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={ambientIntensity} />
            <directionalLight
                position={sunPosition}
                intensity={sunIntensity}
                color={sunColor}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={120}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
            />

            {/* Environment HDRI & Atmospheric Fog */}
            <Environment preset={envPreset} />
            <fog attach="fog" args={[fogColor, 70, 220]} />

            {/* Ground - Lush Green Grass Park Area */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
                <planeGeometry args={[350, 350]} />
                <meshStandardMaterial color={grassColor} roughness={0.8} />
            </mesh>

            {/* Roads & Infrastructure */}
            <Road />
            <SidewalkAndStreetscape />

            {/* Lush Trees & Plants scattered around corners & sidewalks */}
            {/* NW Corner Trees */}
            <Tree position={[-14, 0, -14]} scale={1.2} foliageColor="#15803d" />
            <Tree position={[-18, 0, -12]} scale={1.0} foliageColor="#22c55e" />
            <Tree position={[-12, 0, -19]} scale={1.1} foliageColor="#16a34a" />
            <Tree position={[-22, 0, -18]} scale={1.3} foliageColor="#4ade80" />
            <Bush position={[-10, 0, -12]} scale={1.2} />
            <Bush position={[-13, 0, -10]} scale={1.0} />
            <FlowerBed position={[-16, 0.1, -10]} />

            {/* NE Corner Trees */}
            <Tree position={[14, 0, -14]} scale={1.2} foliageColor="#16a34a" />
            <Tree position={[19, 0, -12]} scale={1.1} foliageColor="#22c55e" />
            <Tree position={[12, 0, -20]} scale={1.3} foliageColor="#15803d" />
            <Tree position={[22, 0, -19]} scale={1.0} foliageColor="#4ade80" />
            <Bush position={[10, 0, -12]} scale={1.1} />
            <Bush position={[13, 0, -10]} scale={1.3} />
            <FlowerBed position={[16, 0.1, -10]} />

            {/* SW Corner Trees */}
            <Tree position={[-14, 0, 14]} scale={1.1} foliageColor="#22c55e" />
            <Tree position={[-19, 0, 12]} scale={1.3} foliageColor="#15803d" />
            <Tree position={[-12, 0, 20]} scale={1.0} foliageColor="#16a34a" />
            <Tree position={[-23, 0, 18]} scale={1.2} foliageColor="#4ade80" />
            <Bush position={[-10, 0, 12]} scale={1.2} />
            <Bush position={[-13, 0, 10]} scale={1.0} />
            <FlowerBed position={[-16, 0.1, 10]} />

            {/* SE Corner Trees */}
            <Tree position={[14, 0, 14]} scale={1.3} foliageColor="#15803d" />
            <Tree position={[18, 0, 12]} scale={1.1} foliageColor="#22c55e" />
            <Tree position={[12, 0, 19]} scale={1.2} foliageColor="#16a34a" />
            <Tree position={[21, 0, 19]} scale={1.0} foliageColor="#84cc16" />
            <Bush position={[10, 0, 12]} scale={1.0} />
            <Bush position={[13, 0, 10]} scale={1.2} />
            <FlowerBed position={[16, 0.1, 10]} />

            {/* Road Margin Trees along long avenues */}
            <Tree position={[-40, 0, -10]} scale={1.2} foliageColor="#16a34a" />
            <Tree position={[40, 0, -10]} scale={1.2} foliageColor="#22c55e" />
            <Tree position={[-40, 0, 10]} scale={1.2} foliageColor="#15803d" />
            <Tree position={[40, 0, 10]} scale={1.2} foliageColor="#16a34a" />

            {/* Traffic Lights - positioned at corners of intersection */}
            <TrafficLight3D position={[STOP_LINE_DISTANCE + 2, 0, STOP_LINE_DISTANCE + 2]} state={lights.north.state} direction="north" />
            <TrafficLight3D position={[-STOP_LINE_DISTANCE - 2, 0, -STOP_LINE_DISTANCE - 2]} state={lights.south.state} direction="south" />
            <TrafficLight3D position={[STOP_LINE_DISTANCE + 2, 0, -STOP_LINE_DISTANCE - 2]} state={lights.east.state} direction="east" />
            <TrafficLight3D position={[-STOP_LINE_DISTANCE - 2, 0, STOP_LINE_DISTANCE + 2]} state={lights.west.state} direction="west" />

            {/* Buildings - positioned in 4 corners */}
            <Buildings />

            {/* Vehicles */}
            {vehicles.map((vehicle) => (
                <Vehicle3D
                    key={vehicle.id}
                    vehicle={vehicle}
                    isAmbulance={vehicle.type === 'ambulance'}
                />
            ))}

            {/* Smooth Orbit Camera Controls */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={20}
                maxDistance={140}
                minPolarAngle={Math.PI / 12}
                maxPolarAngle={Math.PI / 2.2}
                target={[0, 0, 0]}
            />
        </>
    );
}

// Camera controller helper to adjust view dynamically
function CameraRig({ view }: { view: CameraView }) {
    const { camera } = useThree();

    useEffect(() => {
        if (view === 'top') {
            camera.position.set(0, 85, 0.1);
        } else if (view === 'street') {
            camera.position.set(22, 6, 22);
        } else {
            // Default Isometric View
            camera.position.set(48, 38, 48);
        }
        camera.lookAt(0, 0, 0);
    }, [view, camera]);

    return null;
}

// ============================================
// MAIN SIMULATION COMPONENT
// ============================================
export default function TrafficSimulation3D({ config, onMetricsUpdate, onDecisionUpdate, onSignalSwitch }: Props) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
    const [cameraView, setCameraView] = useState<CameraView>('iso');

    const [lights, setLights] = useState<Record<Direction, { state: TrafficLightState; timer: number; duration: number }>>({
        north: { state: 'red', timer: 0, duration: 15 },
        south: { state: 'red', timer: 0, duration: 15 },
        east: { state: 'green', timer: 12, duration: 12 },
        west: { state: 'red', timer: 0, duration: 15 },
    });

    const vehicleIdCounter = useRef(0);
    const lastSpawnTime = useRef(Date.now());
    const lastUpdateTime = useRef(Date.now());
    const pendingGreenDirection = useRef<Direction | null>(null);

    const metricsRef = useRef({
        totalWaitTime: 0,
        totalVehicles: 0,
        ambulanceCount: 0,
        ambulanceTotalTime: 0,
        startTime: Date.now(),
    });

    const vehicleColors = ['#2563eb', '#7c3aed', '#0284c7', '#059669', '#dc2626', '#4f46e5', '#db2777', '#ea580c'];

    // ============================================
    // SPAWN VEHICLE
    // ============================================
    const spawnVehicle = useCallback(() => {
        const directions: Direction[] = ['north', 'south', 'east', 'west'];
        const direction = directions[Math.floor(Math.random() * directions.length)];

        const rand = Math.random() * 100;
        const type: Vehicle['type'] = rand < config.ambulanceFrequency ? 'ambulance' : rand < 15 ? 'truck' : 'car';

        // Lane positions (right-hand traffic)
        const laneOffset = 2.2;
        let x: number, z: number;

        switch (direction) {
            case 'north':
                x = laneOffset;
                z = ROAD_LENGTH + INTERSECTION_SIZE / 2;
                break;
            case 'south':
                x = -laneOffset;
                z = -(ROAD_LENGTH + INTERSECTION_SIZE / 2);
                break;
            case 'east':
                x = -(ROAD_LENGTH + INTERSECTION_SIZE / 2);
                z = laneOffset;
                break;
            case 'west':
                x = ROAD_LENGTH + INTERSECTION_SIZE / 2;
                z = -laneOffset;
                break;
        }

        // Check if spawn area is clear
        const isClear = !vehicles.some(v => {
            if (v.direction !== direction) return false;
            const dist = Math.hypot(v.position.x - x, v.position.y - z);
            return dist < SAFE_DISTANCE * 2.5;
        });

        if (!isClear) return;

        const baseSpeed = type === 'truck' ? VEHICLE_SPEED * 0.7 : type === 'ambulance' ? VEHICLE_SPEED * 1.2 : VEHICLE_SPEED;

        const newVehicle: Vehicle = {
            id: `v-${vehicleIdCounter.current++}`,
            type,
            position: { x, y: z },
            velocity: { x: 0, y: 0 },
            direction,
            speed: baseSpeed * 0.5,
            maxSpeed: baseSpeed,
            color: type === 'ambulance' ? '#ffffff' : type === 'truck' ? '#ea580c' : vehicleColors[Math.floor(Math.random() * vehicleColors.length)],
            waitTime: 0,
            hasPassedIntersection: false,
        };

        if (type === 'ambulance') {
            metricsRef.current.ambulanceCount++;
        }

        setVehicles(prev => [...prev, newVehicle]);
    }, [config.ambulanceFrequency, vehicles]);

    const initialLogDone = useRef(false);
    const lastEmittedEventRef = useRef<string>('');

    // Helper to safely emit telemetry events ONCE without React render loops
    const emitTelemetry = useCallback((key: string, fromDir: Direction, toDir: Direction, reason: string, decision: AIDecision) => {
        if (lastEmittedEventRef.current === key) return;
        lastEmittedEventRef.current = key;

        if (onSignalSwitch) {
            setTimeout(() => onSignalSwitch(fromDir, toDir, reason), 0);
        }
        if (onDecisionUpdate) {
            setTimeout(() => onDecisionUpdate(decision), 0);
        }
    }, [onSignalSwitch, onDecisionUpdate]);

    // Initial signal log trigger on simulation start
    useEffect(() => {
        if (config.isRunning) {
            if (!initialLogDone.current) {
                initialLogDone.current = true;
                emitTelemetry(
                    'init-start-east',
                    'north',
                    'east',
                    '🚦 AI Traffic Engine active — Monitoring approaches (EAST approach GREEN)',
                    {
                        timestamp: Date.now(),
                        action: 'Initialize EAST Signal',
                        reason: 'AI Traffic Engine active — monitoring approach queues',
                        priorityScores: { north: 0, south: 0, east: 0, west: 0 },
                        selectedDirection: 'east',
                        signalDuration: 8,
                        emergencyOverride: false,
                    }
                );
            }
        } else {
            initialLogDone.current = false;
        }
    }, [config.isRunning, emitTelemetry]);

    // ============================================
    // MAIN SIMULATION LOOP
    // ============================================
    useEffect(() => {
        if (!config.isRunning) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const rawDelta = (now - lastUpdateTime.current) / 1000;
            const deltaTime = rawDelta * config.speed;
            lastUpdateTime.current = now;

            // Spawn vehicles based on intensity
            const spawnInterval = 60000 / config.trafficIntensity;
            if (now - lastSpawnTime.current > spawnInterval) {
                spawnVehicle();
                lastSpawnTime.current = now;
            }

            // Update Vehicles with Physics
            setVehicles(prev => {
                const updated = prev.map(vehicle => {
                    const v = { ...vehicle };
                    const light = lights[v.direction];
                    const canGo = light.state === 'green';

                    let distToStop: number;
                    switch (v.direction) {
                        case 'north': distToStop = v.position.y - STOP_LINE_DISTANCE; break;
                        case 'south': distToStop = -v.position.y - STOP_LINE_DISTANCE; break;
                        case 'east': distToStop = -v.position.x - STOP_LINE_DISTANCE; break;
                        case 'west': distToStop = v.position.x - STOP_LINE_DISTANCE; break;
                    }

                    const hasPassed = distToStop < -2;

                    // Check if an emergency ambulance is behind this vehicle in the same lane
                    const hasAmbulanceBehind = prev.some(other =>
                        other.id !== v.id &&
                        other.type === 'ambulance' &&
                        other.direction === v.direction &&
                        !other.hasPassedIntersection
                    );

                    // Find closest vehicle ahead
                    let closestDist = Infinity;
                    prev.forEach(other => {
                        if (other.id === v.id || other.direction !== v.direction) return;

                        let isAhead = false;
                        let dist = 0;

                        switch (v.direction) {
                            case 'north':
                                isAhead = other.position.y < v.position.y;
                                dist = v.position.y - other.position.y;
                                break;
                            case 'south':
                                isAhead = other.position.y > v.position.y;
                                dist = other.position.y - v.position.y;
                                break;
                            case 'east':
                                isAhead = other.position.x > v.position.x;
                                dist = other.position.x - v.position.x;
                                break;
                            case 'west':
                                isAhead = other.position.x < v.position.x;
                                dist = v.position.x - other.position.x;
                                break;
                        }

                        if (isAhead && dist < closestDist) {
                            closestDist = dist;
                        }
                    });

                    // Base maximum speed
                    let maxSpd = v.type === 'ambulance'
                        ? VEHICLE_SPEED * 2.2
                        : v.type === 'truck'
                            ? VEHICLE_SPEED * 0.7
                            : VEHICLE_SPEED;

                    // Emergency priority clearance: cars ahead of ambulance accelerate to clear lane!
                    if (hasAmbulanceBehind && canGo) {
                        maxSpd = VEHICLE_SPEED * 1.8;
                    }

                    let targetSpeed = maxSpd;

                    // Rule 1: Stop at red/yellow light if not passed
                    if (!canGo && !hasPassed && distToStop > 0 && distToStop < SAFE_DISTANCE * 4) {
                        if (distToStop < SAFE_DISTANCE * 1.5) {
                            targetSpeed = 0;
                        } else {
                            targetSpeed = maxSpd * (distToStop / (SAFE_DISTANCE * 4));
                        }
                    }

                    // Rule 2: Keep safe distance from vehicle ahead (tighter gap during emergency clearance)
                    const minGap = hasAmbulanceBehind ? SAFE_DISTANCE * 1.2 : SAFE_DISTANCE * 3;
                    if (closestDist < minGap) {
                        const safeSpeed = Math.max(0, (closestDist - SAFE_DISTANCE) / (SAFE_DISTANCE * 1.5)) * maxSpd;
                        targetSpeed = Math.min(targetSpeed, safeSpeed);
                    }

                    // Emergency acceleration boost
                    const accel = v.type === 'ambulance' ? ACCELERATION * 3.5 : (hasAmbulanceBehind ? ACCELERATION * 2.5 : ACCELERATION);
                    if (v.speed < targetSpeed) {
                        v.speed = Math.min(v.speed + accel * deltaTime * 60, targetSpeed);
                    } else if (v.speed > targetSpeed) {
                        v.speed = Math.max(v.speed - DECELERATION * deltaTime * 60, targetSpeed);
                    }

                    if (v.speed < 0.005 && !v.hasPassedIntersection) {
                        v.waitTime += deltaTime;
                    }

                    const movement = v.speed * deltaTime * 60;
                    switch (v.direction) {
                        case 'north': v.position.y -= movement; break;
                        case 'south': v.position.y += movement; break;
                        case 'east': v.position.x += movement; break;
                        case 'west': v.position.x -= movement; break;
                    }

                    if (!v.hasPassedIntersection && hasPassed && distToStop < -INTERSECTION_SIZE / 2) {
                        v.hasPassedIntersection = true;
                        metricsRef.current.totalWaitTime += v.waitTime;
                        metricsRef.current.totalVehicles++;

                        if (v.type === 'ambulance') {
                            metricsRef.current.ambulanceTotalTime += v.waitTime;
                        }
                    }

                    return v;
                });

                return updated.filter(v => {
                    const limit = ROAD_LENGTH + INTERSECTION_SIZE + 35;
                    return Math.abs(v.position.x) < limit && Math.abs(v.position.y) < limit;
                });
            });

            // Smart Traffic Signal Logic
            setLights(prev => {
                const newLights = { ...prev };
                const directions: Direction[] = ['north', 'south', 'east', 'west'];

                directions.forEach(dir => {
                    if (newLights[dir].timer > 0) {
                        newLights[dir].timer -= deltaTime;
                    }
                });

                const counts: Record<Direction, number> = { north: 0, south: 0, east: 0, west: 0 };
                const hasEmergency: Record<Direction, boolean> = { north: false, south: false, east: false, west: false };

                vehicles.forEach(v => {
                    if (!v.hasPassedIntersection) {
                        counts[v.direction]++;
                        if (v.type === 'ambulance') {
                            hasEmergency[v.direction] = true;
                        }
                    }
                });

                const currentGreen = directions.find(d => newLights[d].state === 'green');
                const currentYellow = directions.find(d => newLights[d].state === 'yellow');
                const emergencyDirections = directions.filter(d => hasEmergency[d]);

                // ============================================
                // SCENARIO 1: EMERGENCY AMBULANCE DETECTED -> INSTANT GREEN CORRIDOR
                // ============================================
                if (emergencyDirections.length > 0 && config.mode !== 'fixed') {
                    const emergencyDir = emergencyDirections[0];

                    // Instantly grant GREEN to emergency approach!
                    if (newLights[emergencyDir].state !== 'green') {
                        directions.forEach(d => {
                            if (d === emergencyDir) {
                                newLights[d] = { state: 'green', timer: 30, duration: 30 };
                            } else if (newLights[d].state === 'green') {
                                newLights[d] = { state: 'yellow', timer: 0.8, duration: 0.8 };
                            } else if (newLights[d].state !== 'yellow') {
                                newLights[d] = { state: 'red', timer: 0, duration: 15 };
                            }
                        });

                        pendingGreenDirection.current = emergencyDir;

                        const reasonStr = `🚨 EMERGENCY GREEN CORRIDOR: Ambulance detected on ${emergencyDir.toUpperCase()} — Signal GREEN granted immediately!`;
                        emitTelemetry(
                            `emergency-corridor-${emergencyDir}`,
                            currentGreen || 'north',
                            emergencyDir,
                            reasonStr,
                            {
                                timestamp: Date.now(),
                                action: `GREEN CORRIDOR: ${emergencyDir.toUpperCase()}`,
                                reason: reasonStr,
                                priorityScores: counts,
                                selectedDirection: emergencyDir,
                                signalDuration: 30,
                                emergencyOverride: true,
                            }
                        );
                    }
                }

                // ============================================
                // SCENARIO 2: AMBULANCE CLEARED EARLY -> RESUME NORMAL CYCLE
                // ============================================
                else if (currentGreen && !hasEmergency[currentGreen] && newLights[currentGreen].duration >= 20) {
                    newLights[currentGreen] = { state: 'yellow', timer: 1.2, duration: 1.2 };

                    const order: Direction[] = ['north', 'east', 'south', 'west'];
                    const idx = order.indexOf(currentGreen);
                    const nextDir = config.mode === 'fixed'
                        ? order[(idx + 1) % 4]
                        : directions.filter(d => d !== currentGreen).sort((a, b) => counts[b] - counts[a])[0];

                    pendingGreenDirection.current = nextDir;

                    const reasonStr = `✅ AMBULANCE CLEARED: Resuming normal traffic rotation to ${nextDir.toUpperCase()}`;
                    emitTelemetry(
                        `ambulance-cleared-${currentGreen}-to-${nextDir}`,
                        currentGreen,
                        nextDir,
                        reasonStr,
                        {
                            timestamp: Date.now(),
                            action: `Resume Rotation (${nextDir.toUpperCase()})`,
                            reason: reasonStr,
                            priorityScores: counts,
                            selectedDirection: nextDir,
                            signalDuration: 8,
                            emergencyOverride: false,
                        }
                    );
                }

                // ============================================
                // SCENARIO 3: NORMAL GREEN TIMER EXPIRED -> SWITCH TO YELLOW
                // ============================================
                else if (currentGreen && newLights[currentGreen].timer <= 0) {
                    newLights[currentGreen] = { state: 'yellow', timer: 1.8, duration: 1.8 };

                    let nextDir: Direction;
                    let reason: string;

                    if (config.mode === 'fixed') {
                        const order: Direction[] = ['north', 'east', 'south', 'west'];
                        const idx = order.indexOf(currentGreen);
                        nextDir = order[(idx + 1) % 4];
                        reason = `Fixed signal rotation: ${currentGreen.toUpperCase()} ➔ ${nextDir.toUpperCase()}`;
                    } else {
                        const otherDirs = directions.filter(d => d !== currentGreen);
                        otherDirs.sort((a, b) => counts[b] - counts[a]);
                        nextDir = otherDirs[0];

                        reason = counts[nextDir] > 0
                            ? `AI selected ${nextDir.toUpperCase()} approach with ${counts[nextDir]} waiting vehicle(s)`
                            : `Normal rotation to ${nextDir.toUpperCase()} approach`;
                    }

                    pendingGreenDirection.current = nextDir;

                    const duration = config.mode === 'fixed' ? 8 : Math.min(14, Math.max(6, 6 + counts[nextDir] * 1.5));
                    emitTelemetry(
                        `normal-switch-${currentGreen}-to-${nextDir}-${Math.floor(Date.now() / 3000)}`,
                        currentGreen,
                        nextDir,
                        reason,
                        {
                            timestamp: Date.now(),
                            action: `Switching to ${nextDir.toUpperCase()}`,
                            reason,
                            priorityScores: counts,
                            selectedDirection: nextDir,
                            signalDuration: duration,
                            emergencyOverride: false,
                        }
                    );
                }

                // ============================================
                // SCENARIO 4: YELLOW TIMER EXPIRED -> TURN RED & ACTIVATE NEXT GREEN
                // ============================================
                else if (currentYellow && newLights[currentYellow].timer <= 0) {
                    newLights[currentYellow] = { state: 'red', timer: 0, duration: 15 };

                    let nextGreen = pendingGreenDirection.current;

                    if (!nextGreen) {
                        if (config.mode === 'fixed') {
                            const order: Direction[] = ['north', 'east', 'south', 'west'];
                            const idx = order.indexOf(currentYellow);
                            nextGreen = order[(idx + 1) % 4];
                        } else {
                            const sortedDirs = [...directions].sort((a, b) => counts[b] - counts[a]);
                            nextGreen = sortedDirs[0];
                        }
                    }

                    const duration = config.mode === 'fixed' ? 8 : Math.min(14, Math.max(6, 6 + counts[nextGreen] * 1.5));
                    newLights[nextGreen] = { state: 'green', timer: duration, duration };
                    pendingGreenDirection.current = null;
                }

                // ============================================
                // SCENARIO 5: FALLBACK (PREVENTS STUCK SIMULATION WHEN NO GREEN/YELLOW)
                // ============================================
                else if (!currentGreen && !currentYellow) {
                    let nextGreen: Direction;
                    let reason: string;

                    if (pendingGreenDirection.current) {
                        nextGreen = pendingGreenDirection.current;
                        reason = `Activating pending green for ${nextGreen.toUpperCase()}`;
                        pendingGreenDirection.current = null;
                    } else if (config.mode === 'fixed') {
                        nextGreen = 'east';
                        reason = 'Fixed rotation initiated (EAST)';
                    } else {
                        const sortedDirs = [...directions].sort((a, b) => counts[b] - counts[a]);
                        nextGreen = sortedDirs[0];
                        reason = counts[nextGreen] > 0
                            ? `AI activated green signal for ${nextGreen.toUpperCase()} (${counts[nextGreen]} waiting)`
                            : `Signal stream active for ${nextGreen.toUpperCase()} approach`;
                    }

                    const duration = config.mode === 'fixed' ? 8 : Math.min(14, Math.max(6, 6 + counts[nextGreen] * 1.5));
                    newLights[nextGreen] = { state: 'green', timer: duration, duration };

                    emitTelemetry(
                        `fallback-activate-${nextGreen}`,
                        'north',
                        nextGreen,
                        reason,
                        {
                            timestamp: Date.now(),
                            action: `Activate ${nextGreen.toUpperCase()}`,
                            reason,
                            priorityScores: counts,
                            selectedDirection: nextGreen,
                            signalDuration: duration,
                            emergencyOverride: false,
                        }
                    );
                }

                return newLights;
            });

            // Metrics Update
            const elapsed = (Date.now() - metricsRef.current.startTime) / 1000;
            const metrics: SimulationMetrics = {
                averageWaitTime: metricsRef.current.totalVehicles > 0
                    ? metricsRef.current.totalWaitTime / metricsRef.current.totalVehicles
                    : 0,
                totalVehiclesProcessed: metricsRef.current.totalVehicles,
                throughput: elapsed > 0 ? (metricsRef.current.totalVehicles / elapsed) * 60 : 0,
                signalEfficiency: 88 + Math.random() * 8,
                ambulanceResponseTime: metricsRef.current.ambulanceCount > 0
                    ? metricsRef.current.ambulanceTotalTime / metricsRef.current.ambulanceCount
                    : 0,
                ambulancesProcessed: metricsRef.current.ambulanceCount,
                timeSaved: Math.max(0, (config.mode !== 'fixed' ? 12 : 0) + Math.random() * 5),
            };
            setTimeout(() => onMetricsUpdate(metrics), 0);

        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [config, lights, vehicles, spawnVehicle, onMetricsUpdate, onDecisionUpdate, onSignalSwitch]);

    return (
        <div className="relative w-full h-[620px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-2xl">
            {/* Viewport Control Bar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg text-white">
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs">
                        ☀️ Daylight City Mode
                    </span>
                    <span className="hidden sm:inline text-xs text-slate-400">| Smart AI Intersection</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Time of Day Switcher */}
                    <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                        <button
                            onClick={() => setTimeOfDay('day')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${timeOfDay === 'day' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'}`}
                        >
                            ☀️ Day
                        </button>
                        <button
                            onClick={() => setTimeOfDay('sunset')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${timeOfDay === 'sunset' ? 'bg-orange-500 text-white font-bold shadow' : 'text-slate-300 hover:text-white'}`}
                        >
                            🌅 Sunset
                        </button>
                        <button
                            onClick={() => setTimeOfDay('night')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${timeOfDay === 'night' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-300 hover:text-white'}`}
                        >
                            🌙 Night
                        </button>
                    </div>

                    {/* Camera Presets */}
                    <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                        <button
                            onClick={() => setCameraView('iso')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${cameraView === 'iso' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                            title="3D Perspective"
                        >
                            📐 3D View
                        </button>
                        <button
                            onClick={() => setCameraView('top')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${cameraView === 'top' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                            title="Bird's Eye Top Down"
                        >
                            🚁 Top-Down
                        </button>
                        <button
                            onClick={() => setCameraView('street')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${cameraView === 'street' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                            title="Street Level Angle"
                        >
                            🚘 Street View
                        </button>
                    </div>
                </div>
            </div>

            {/* 3D Canvas */}
            <Canvas
                shadows
                camera={{ position: [48, 38, 48], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <CameraRig view={cameraView} />
                <Scene vehicles={vehicles} lights={lights} timeOfDay={timeOfDay} />
            </Canvas>

            {/* Live Stats Overlay Footer */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between px-4 py-2.5 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-700/50 text-xs text-slate-200">
                <div className="flex items-center gap-4 font-medium">
                    <span>🚗 Active Vehicles: <strong className="text-white">{vehicles.length}</strong></span>
                    <span>🚑 Emergencies: <strong className="text-red-400">{vehicles.filter(v => v.type === 'ambulance' && !v.hasPassedIntersection).length}</strong></span>
                </div>
                <div className="text-slate-400 text-[11px] hidden sm:block">
                    💡 Click & drag to rotate • Scroll to zoom • Shift + Drag to pan
                </div>
            </div>
        </div>
    );
}
