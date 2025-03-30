// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
    // Debug helper
    const debug = document.getElementById("debug");
    function log(message) {
        debug.style.display = "block";
        debug.textContent = message;
        console.log(message);
    }

    // Get the canvas element
    const canvas = document.getElementById("renderCanvas");

    // Check if the canvas is available
    if (!canvas) {
        log("Canvas element not found!");
        return;
    }

    // Create the Babylon engine
    const engine = new BABYLON.Engine(canvas, true);

    // Track objects and their properties
    const physicsObjects = [];
    let selectedObject = null;

    // Physics parameters
    let gravity = 9.81;
    let electricFieldStrength = 10;
    let restitution = 0.7;
    let friction = 0.2;

    // Create our scene
    function createScene() {
        log("Creating scene...");

        // Create the scene
        const scene = new BABYLON.Scene(engine);

        // Enable physics with Cannon.js
        try {
            const gravityVector = new BABYLON.Vector3(0, -gravity, 0);
            const physicsPlugin = new BABYLON.CannonJSPlugin();
            scene.enablePhysics(gravityVector, physicsPlugin);
            log("Physics initialized with Cannon.js");
        } catch (error) {
            log("Failed to initialize physics: " + error.message);
            return null;
        }

        // Camera
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 20, new BABYLON.Vector3(0, 5, 0), scene);
        camera.attachControl(canvas, true);
        camera.upperBetaLimit = Math.PI / 2;
        camera.lowerRadiusLimit = 5;
        camera.upperRadiusLimit = 50;

        // Lights
        const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light1.intensity = 0.7;

        const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(0, -1, 1), scene);
        light2.intensity = 0.5;

        // Create ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = groundMaterial;

        // Add physics to ground
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground,
            BABYLON.PhysicsImpostor.BoxImpostor,
            { mass: 0, friction: friction, restitution: restitution },
            scene
        );

        // Add walls to prevent objects from falling off
        const wallHeight = 2;
        const wallThickness = 0.5;

        // Parameters for the walls
        const wallParams = [
            { name: "northWall", position: new BABYLON.Vector3(0, wallHeight / 2, -15), scaling: new BABYLON.Vector3(30, wallHeight, wallThickness) },
            { name: "southWall", position: new BABYLON.Vector3(0, wallHeight / 2, 15), scaling: new BABYLON.Vector3(30, wallHeight, wallThickness) },
            { name: "eastWall", position: new BABYLON.Vector3(15, wallHeight / 2, 0), scaling: new BABYLON.Vector3(wallThickness, wallHeight, 30) },
            { name: "westWall", position: new BABYLON.Vector3(-15, wallHeight / 2, 0), scaling: new BABYLON.Vector3(wallThickness, wallHeight, 30) }
        ];

        // Create all walls
        wallParams.forEach(params => {
            const wall = BABYLON.MeshBuilder.CreateBox(params.name, {}, scene);
            wall.position = params.position;
            wall.scaling = params.scaling;

            const wallMaterial = new BABYLON.StandardMaterial(params.name + "Material", scene);
            wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            wallMaterial.alpha = 0.3;
            wall.material = wallMaterial;

            wall.physicsImpostor = new BABYLON.PhysicsImpostor(
                wall,
                BABYLON.PhysicsImpostor.BoxImpostor,
                { mass: 0, friction: friction, restitution: restitution },
                scene
            );
        });

        // Register click event to select objects
        scene.onPointerDown = function (evt, pickResult) {
            if (pickResult.hit && pickResult.pickedMesh !== ground &&
                !wallParams.some(w => pickResult.pickedMesh.name === w.name)) {

                selectObject(pickResult.pickedMesh);
            } else {
                deselectObject();
            }
        };

        // ability to create gizmos for object manipulation
        var gizmoManager = new BABYLON.GizmoManager(scene);

        gizmoManager.positionGizmoEnabled = true;
        gizmoManager.rotationGizmoEnabled = false;
        gizmoManager.scaleGizmoEnabled = false;
        
        counter = 0;
        document.onkeydown = function (event) {
            if (event.key == ' ') {
                counter++;
                if (counter % 4 === 0) {
                    gizmoManager.positionGizmoEnabled = true;
                    gizmoManager.rotationGizmoEnabled = false;
                    gizmoManager.scaleGizmoEnabled = false;
                } else if (counter % 4 === 1) {
                    gizmoManager.positionGizmoEnabled = false;
                    gizmoManager.rotationGizmoEnabled = true;
                    gizmoManager.scaleGizmoEnabled = false;
                } else if (counter % 4 === 2) {
                    gizmoManager.positionGizmoEnabled = false;
                    gizmoManager.rotationGizmoEnabled = false;
                    gizmoManager.scaleGizmoEnabled = true;
                } else {
                    gizmoManager.positionGizmoEnabled = false;
                    gizmoManager.rotationGizmoEnabled = false;
                    gizmoManager.scaleGizmoEnabled = false;
                }
            }
        };

        log("Scene created successfully");
        return scene;
    }

    // Create the scene
    const scene = createScene();

    if (!scene) {
        log("Failed to create scene!");
        return;
    }

    // Register before render to apply electromagnetic forces
    scene.registerBeforeRender(function () {
        applyElectromagneticForces();
    });

    // Render loop
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Function to select an object
    function selectObject(mesh) {
        deselectObject();

        selectedObject = mesh;

        // Highlight selected object
        if (selectedObject.material) {
            selectedObject.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        }

        // Update UI with selected object properties
        updateSelectedObjectUI();
    }

    // Function to deselect the currently selected object
    function deselectObject() {
        if (selectedObject && selectedObject.material) {
            selectedObject.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }

        selectedObject = null;
        updateSelectedObjectUI();
    }

    // Update the UI for the selected object
    function updateSelectedObjectUI() {
        const propertiesPanel = document.getElementById("selectedObjectProperties");

        if (!selectedObject) {
            propertiesPanel.innerHTML = "No object selected";
            return;
        }

        const obj = physicsObjects.find(o => o.mesh === selectedObject);
        if (!obj) return;

        let html = `<div>Name: ${selectedObject.name}</div>`;
        html += `<div>Type: ${obj.type}</div>`;
        html += `<div>Charge: ${obj.charge}</div>`;
        html += `<div>Mass: ${obj.physicsImpostor.mass.toFixed(2)}</div>`;

        html += `<div style="margin-top:10px">
        <label>Charge: </label>
        <select id="chargeSelector">
          <option value="neutral" ${obj.charge === 'neutral' ? 'selected' : ''}>Neutral</option>
          <option value="positive" ${obj.charge === 'positive' ? 'selected' : ''}>Positive</option>
          <option value="negative" ${obj.charge === 'negative' ? 'selected' : ''}>Negative</option>
        </select>
      </div>`;

        html += `<div style="margin-top:10px">
        <label>Mass: </label>
        <input type="number" id="massInput" min="0.1" max="100" step="0.1" value="${obj.physicsImpostor.mass.toFixed(1)}">
      </div>`;

        html += `<button id="deleteObject" style="margin-top:10px;padding:5px;width:100%;">Delete Object</button>`;

        propertiesPanel.innerHTML = html;

        // Add event listeners
        document.getElementById("chargeSelector").addEventListener("change", function (e) {
            obj.charge = e.target.value;
            updateObjectAppearance(obj);
        });

        document.getElementById("massInput").addEventListener("change", function (e) {
            const newMass = parseFloat(e.target.value);
            if (!isNaN(newMass) && newMass > 0) {
                obj.physicsImpostor.setMass(newMass);
            }
        });

        document.getElementById("deleteObject").addEventListener("click", function () {
            deleteSelectedObject();
        });
    }

    // Delete the currently selected object
    function deleteSelectedObject() {
        if (!selectedObject) return;

        const index = physicsObjects.findIndex(o => o.mesh === selectedObject);
        if (index !== -1) {
            physicsObjects.splice(index, 1);
        }

        selectedObject.dispose();
        selectedObject = null;
        updateSelectedObjectUI();
    }

    // Update object appearance based on its properties
    function updateObjectAppearance(obj) {
        if (!obj.mesh || !obj.mesh.material) return;

        if (obj.charge === "positive") {
            obj.mesh.material.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        } else if (obj.charge === "negative") {
            obj.mesh.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 1);
        } else {
            // Neutral objects
            if (obj.type === "sphere") {
                obj.mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            } else if (obj.type === "cube") {
                obj.mesh.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.8);
            } else if (obj.type === "cylinder") {
                obj.mesh.material.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
            }
        }
    }

    // Apply electromagnetic forces between charged objects
    function applyElectromagneticForces() {
        if (electricFieldStrength <= 0) return;

        // Apply forces between all pairs of charged objects
        for (let i = 0; i < physicsObjects.length; i++) {
            const obj1 = physicsObjects[i];
            if (obj1.charge === "neutral") continue;

            for (let j = i + 1; j < physicsObjects.length; j++) {
                const obj2 = physicsObjects[j];
                if (obj2.charge === "neutral") continue;

                // Calculate distance and direction
                const dir = obj1.mesh.position.subtract(obj2.mesh.position);
                const distance = dir.length();

                // Skip if objects are too close or too far
                if (distance < 0.1 || distance > 20) continue;

                // Normalize direction
                dir.normalize();

                // Calculate force magnitude (inverse square law)
                // Like charges repel, opposite charges attract
                const forceMagnitude = electricFieldStrength / (distance * distance);
                let sign = 1;

                if ((obj1.charge === "positive" && obj2.charge === "positive") ||
                    (obj1.charge === "negative" && obj2.charge === "negative")) {
                    // Repulsion for like charges
                    sign = 1;
                } else {
                    // Attraction for opposite charges
                    sign = -1;
                }

                // Apply forces in opposite directions
                const forceVector = dir.scale(sign * forceMagnitude);

                // Scale force by mass
                const force1 = forceVector.scale(obj2.physicsImpostor.mass);
                const force2 = forceVector.scale(-obj1.physicsImpostor.mass);

                // Apply the forces
                obj1.physicsImpostor.applyForce(force1, obj1.mesh.position);
                obj2.physicsImpostor.applyForce(force2, obj2.mesh.position);
            }
        }
    }

    // Create a physics object in the scene
    function createPhysicsObject(type, charge, position) {
        log(`Creating ${type} with charge ${charge} at position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);

        let mesh;
        let impostor;

        const objectMaterial = new BABYLON.StandardMaterial(`${type}Material`, scene);

        // Create mesh based on type
        if (type === "sphere") {
            mesh = BABYLON.MeshBuilder.CreateSphere(`sphere-${Date.now()}`, { diameter: 1 }, scene);
            impostor = BABYLON.PhysicsImpostor.SphereImpostor;
        } else if (type === "cube") {
            mesh = BABYLON.MeshBuilder.CreateBox(`cube-${Date.now()}`, { size: 1 }, scene);
            impostor = BABYLON.PhysicsImpostor.BoxImpostor;
        } else if (type === "cylinder") {
            mesh = BABYLON.MeshBuilder.CreateCylinder(`cylinder-${Date.now()}`, {
                height: 1,
                diameter: 1
            }, scene);
            impostor = BABYLON.PhysicsImpostor.CylinderImpostor;
        } else {
            log("Unknown object type: " + type);
            return;
        }

        // Set position
        mesh.position = position;

        // Set material colors based on charge
        if (charge === "positive") {
            objectMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        } else if (charge === "negative") {
            objectMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 1);
        } else {
            // Neutral objects
            if (type === "sphere") {
                objectMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            } else if (type === "cube") {
                objectMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.8);
            } else if (type === "cylinder") {
                objectMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
            }
        }

        mesh.material = objectMaterial;

        try {
            // Add physics
            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                mesh,
                impostor,
                {
                    mass: 1,
                    friction: friction,
                    restitution: restitution
                },
                scene
            );

            // Store object properties
            const object = {
                mesh: mesh,
                type: type,
                charge: charge,
                physicsImpostor: mesh.physicsImpostor
            };

            physicsObjects.push(object);

            // Select the newly created object
            selectObject(mesh);

            log(`Created ${type} successfully`);
            return object;
        } catch (error) {
            log("Error creating physics impostor: " + error.message);
            if (mesh) {
                mesh.dispose();
            }
            return null;
        }
    }

    // Initialize controls
    function initializeControls() {
        // Gravity slider
        const gravitySlider = document.getElementById("gravitySlider");
        const gravityValue = document.getElementById("gravityValue");

        // Set initial values
        gravityValue.textContent = gravity.toFixed(2);

        gravitySlider.addEventListener("input", function () {
            gravity = parseFloat(this.value);
            gravityValue.textContent = gravity.toFixed(2);

            // Update gravity in the physics engine
            if (scene.getPhysicsEngine()) {
                scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -gravity, 0));
            }
        });

        // Electric field strength slider
        const fieldStrengthSlider = document.getElementById("fieldStrengthSlider");
        const fieldStrengthValue = document.getElementById("fieldStrengthValue");

        // Set initial values
        fieldStrengthValue.textContent = electricFieldStrength.toFixed(1);

        fieldStrengthSlider.addEventListener("input", function () {
            electricFieldStrength = parseFloat(this.value);
            fieldStrengthValue.textContent = electricFieldStrength.toFixed(1);
        });

        // Restitution slider
        const restitutionSlider = document.getElementById("restitutionSlider");
        const restitutionValue = document.getElementById("restitutionValue");

        // Set initial values
        restitutionValue.textContent = restitution.toFixed(2);

        restitutionSlider.addEventListener("input", function () {
            restitution = parseFloat(this.value);
            restitutionValue.textContent = restitution.toFixed(2);

            // Update all objects
            physicsObjects.forEach(obj => {
                if (obj.physicsImpostor && typeof obj.physicsImpostor.setParam === 'function') {
                    obj.physicsImpostor.setParam("restitution", restitution);
                }
            });
        });

        // Friction slider
        const frictionSlider = document.getElementById("frictionSlider");
        const frictionValue = document.getElementById("frictionValue");

        // Set initial values
        frictionValue.textContent = friction.toFixed(2);

        frictionSlider.addEventListener("input", function () {
            friction = parseFloat(this.value);
            frictionValue.textContent = friction.toFixed(2);

            // Update all objects
            physicsObjects.forEach(obj => {
                if (obj.physicsImpostor && typeof obj.physicsImpostor.setParam === 'function') {
                    obj.physicsImpostor.setParam("friction", friction);
                }
            });
        });

        // Reset button
        document.getElementById("resetScene").addEventListener("click", function () {
            // Remove all physics objects
            while (physicsObjects.length > 0) {
                const obj = physicsObjects.pop();
                if (obj.mesh) {
                    obj.mesh.dispose();
                }
            }

            deselectObject();
            log("Scene reset");
        });

        // Set initial slider positions based on values
        gravitySlider.value = gravity;
        fieldStrengthSlider.value = electricFieldStrength;
        restitutionSlider.value = restitution;
        frictionSlider.value = friction;
    }

    // Add click handlers to toolbar items
    function setupToolbarItems() {
        const toolbarItems = document.querySelectorAll(".toolbar-item");

        toolbarItems.forEach(item => {
            // Make items draggable
            item.setAttribute("draggable", "true");

            // Add dragstart event
            item.addEventListener("dragstart", function (e) {
                const type = this.getAttribute("data-type");
                const charge = this.getAttribute("data-charge");

                e.dataTransfer.setData("text/plain", JSON.stringify({
                    type: type,
                    charge: charge
                }));
            });

            // Add click event for easier interaction
            item.addEventListener("click", function () {
                const type = this.getAttribute("data-type");
                const charge = this.getAttribute("data-charge");

                // Create the object at a default position above the ground
                createPhysicsObject(type, charge, new BABYLON.Vector3(0, 5, 0));
            });
        });

        // Set up drop area (the canvas)
        canvas.addEventListener("dragover", function (e) {
            e.preventDefault();
        });

        canvas.addEventListener("drop", function (e) {
            e.preventDefault();

            try {
                const data = JSON.parse(e.dataTransfer.getData("text/plain"));

                // Get canvas rect to adjust coordinates
                const canvasRect = canvas.getBoundingClientRect();
                const pickX = e.clientX - canvasRect.left;
                const pickY = e.clientY - canvasRect.top;

                // Convert screen coordinates to 3D position
                const pickResult = scene.pick(pickX, pickY);

                // If we hit something in the scene
                if (pickResult.hit) {
                    // Create position slightly above the hit point
                    const position = pickResult.pickedPoint.clone();
                    position.y += 1; // Lift off the ground

                    createPhysicsObject(data.type, data.charge, position);
                } else {
                    // If we didn't hit anything, create at a default position
                    createPhysicsObject(data.type, data.charge, new BABYLON.Vector3(0, 5, 0));
                }
            } catch (error) {
                log("Error dropping object: " + error.message);
            }
        });
    }

    // Initialize everything
    initializeControls();
    setupToolbarItems();

    // Show debug info initially
    log("Physics playground initialized. Click or drag objects from the toolbar.");

    // Hide debug after 5 seconds
    setTimeout(() => {
        debug.style.display = "none";
    }, 5000);

    // Handle window resize
    window.addEventListener("resize", function () {
        engine.resize();
    });
});