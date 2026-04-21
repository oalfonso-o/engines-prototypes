using System;
using System.IO;
using Canuter.UnityV1;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace Canuter.UnityV1.Editor
{
    public static class ProjectBootstrap
    {
        private const string SceneDirectory = "Assets/Generated";
        private const string ScenePath = "Assets/Generated/Main.unity";
        private const string BuildDirectory = "Builds/Mac";
        private const string BuildPath = "Builds/Mac/CanuterUnityV1.app";

        public static void EnsureProjectReady()
        {
            Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), SceneDirectory));
            CreateOrRefreshMainScene();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        public static void BuildMacPlayer()
        {
            EnsureProjectReady();
            Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), BuildDirectory));

            BuildPlayerOptions options = new BuildPlayerOptions();
            options.scenes = new[] { ScenePath };
            options.locationPathName = BuildPath;
            options.target = BuildTarget.StandaloneOSX;
            options.options = BuildOptions.None;

            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new Exception("Unity macOS build failed.");
            }
        }

        private static void CreateOrRefreshMainScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.36f, 0.39f, 0.45f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.06f, 0.08f, 0.12f);
            RenderSettings.fogStartDistance = 14f;
            RenderSettings.fogEndDistance = 54f;

            GameObject lightObject = new GameObject("Directional Light");
            Light directionalLight = lightObject.AddComponent<Light>();
            directionalLight.type = LightType.Directional;
            directionalLight.color = new Color(1.0f, 0.95f, 0.84f);
            directionalLight.intensity = 1.35f;
            lightObject.transform.rotation = Quaternion.Euler(42f, -32f, 0f);

            GameObject cameraObject = new GameObject("Orbit Camera");
            cameraObject.tag = "MainCamera";
            Camera sceneCamera = cameraObject.AddComponent<Camera>();
            sceneCamera.clearFlags = CameraClearFlags.SolidColor;
            sceneCamera.backgroundColor = new Color(0.05f, 0.07f, 0.11f);
            sceneCamera.fieldOfView = 60f;

            OrbitCameraRig orbitRig = cameraObject.AddComponent<OrbitCameraRig>();
            orbitRig.orbitCenter = new Vector3(0f, 1.5f, 0f);
            orbitRig.orbitRadius = 18f;
            orbitRig.orbitHeight = 8.5f;
            orbitRig.orbitSpeedDegrees = 14f;
            orbitRig.lookHeight = 1.5f;

            GameObject bootstrapObject = new GameObject("Code Arena Bootstrap");
            bootstrapObject.AddComponent<CodeArenaBootstrap>();

            EditorSceneManager.MarkSceneDirty(scene);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            EditorSceneManager.SaveScene(scene, ScenePath);
        }
    }
}
