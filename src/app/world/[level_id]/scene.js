import * as THREE from "three";

class BridGeoScene {
    constructor(node, serverId) {
        console.log(serverId);

        const width = node.clientWidth, height = node.clientHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();

        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(width, height);
        node.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.width =
            this.renderer.domElement.style.height = `100%`;
        this.renderer.domElement.style.display = `block`;

        this.camera.position.z = 5;
        this.animate();

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        this.animates.push(() => {
            let plus = .01;
            cube.rotation.x += plus;
            cube.rotation.y += plus;
            cube.rotation.z += plus;
        });
    }

    resize = () => {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth, height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    animates = []
    animate = () => {
        requestAnimationFrame(this.animate);
        this.resize();
        this.animates.forEach(func => func());
        this.renderer.render(this.scene, this.camera);
    }
}

export default BridGeoScene;
