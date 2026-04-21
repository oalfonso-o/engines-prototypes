using UnityEngine;

namespace Canuter.UnityV1
{
    public sealed class CodeArenaBootstrap : MonoBehaviour
    {
        private static readonly Vector3[] TargetPositions =
        {
            new Vector3(-8f, 1.5f, -5f),
            new Vector3(-2.5f, 2.2f, 6f),
            new Vector3(4.5f, 1.3f, -3f),
            new Vector3(8f, 2.6f, 5f),
        };

        private void Awake()
        {
            Application.targetFrameRate = 120;
            QualitySettings.vSyncCount = 0;
            BuildArena();
        }

        private void BuildArena()
        {
            GameObject arenaRoot = new GameObject("Runtime Arena");

            CreateBox(
                arenaRoot.transform,
                "Floor",
                new Vector3(0f, -0.5f, 0f),
                new Vector3(26f, 1f, 26f),
                new Color(0.18f, 0.2f, 0.23f));

            CreateBox(
                arenaRoot.transform,
                "North Wall",
                new Vector3(0f, 2.5f, 13f),
                new Vector3(26f, 5f, 1f),
                new Color(0.22f, 0.28f, 0.35f));

            CreateBox(
                arenaRoot.transform,
                "South Wall",
                new Vector3(0f, 2.5f, -13f),
                new Vector3(26f, 5f, 1f),
                new Color(0.22f, 0.28f, 0.35f));

            CreateBox(
                arenaRoot.transform,
                "East Wall",
                new Vector3(13f, 2.5f, 0f),
                new Vector3(1f, 5f, 26f),
                new Color(0.24f, 0.25f, 0.33f));

            CreateBox(
                arenaRoot.transform,
                "West Wall",
                new Vector3(-13f, 2.5f, 0f),
                new Vector3(1f, 5f, 26f),
                new Color(0.24f, 0.25f, 0.33f));

            CreateBox(
                arenaRoot.transform,
                "Center Platform",
                new Vector3(0f, 0.35f, 0f),
                new Vector3(7f, 0.7f, 7f),
                new Color(0.77f, 0.43f, 0.18f));

            CreateBox(
                arenaRoot.transform,
                "Runway",
                new Vector3(0f, 0.08f, -8.5f),
                new Vector3(3f, 0.16f, 6f),
                new Color(0.89f, 0.72f, 0.27f));

            for (int index = 0; index < TargetPositions.Length; index += 1)
            {
                CreateTarget(arenaRoot.transform, index, TargetPositions[index]);
            }
        }

        private static void CreateTarget(Transform parent, int index, Vector3 position)
        {
            GameObject target = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            target.name = "Target " + (index + 1);
            target.transform.SetParent(parent, false);
            target.transform.position = position;
            target.transform.localScale = new Vector3(1.4f, 1.1f, 1.4f);

            Renderer renderer = target.GetComponent<Renderer>();
            renderer.sharedMaterial = CreateMaterial(
                index % 2 == 0 ? new Color(0.86f, 0.26f, 0.22f) : new Color(0.15f, 0.68f, 0.84f));

            BobAndSpinTarget bobAndSpinTarget = target.AddComponent<BobAndSpinTarget>();
            bobAndSpinTarget.bobAmplitude = 0.35f + (index * 0.07f);
            bobAndSpinTarget.bobSpeed = 1.2f + (index * 0.2f);
            bobAndSpinTarget.spinSpeedDegrees = 75f + (index * 18f);
            bobAndSpinTarget.phaseOffset = index * 0.6f;
        }

        private static GameObject CreateBox(
            Transform parent,
            string name,
            Vector3 position,
            Vector3 scale,
            Color color)
        {
            GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
            box.name = name;
            box.transform.SetParent(parent, false);
            box.transform.position = position;
            box.transform.localScale = scale;

            Renderer renderer = box.GetComponent<Renderer>();
            renderer.sharedMaterial = CreateMaterial(color);

            return box;
        }

        private static Material CreateMaterial(Color color)
        {
            Shader shader = Shader.Find("Standard");
            if (shader == null)
            {
                shader = Shader.Find("Universal Render Pipeline/Lit");
            }

            Material material = new Material(shader);
            material.color = color;
            return material;
        }
    }
}
