using UnityEngine;

namespace Canuter.UnityV1
{
    public sealed class OrbitCameraRig : MonoBehaviour
    {
        public Vector3 orbitCenter = Vector3.zero;
        public float orbitRadius = 18f;
        public float orbitHeight = 8f;
        public float orbitSpeedDegrees = 16f;
        public float lookHeight = 1.5f;

        private float angleDegrees;

        private void Start()
        {
            UpdatePose();
        }

        private void LateUpdate()
        {
            angleDegrees += orbitSpeedDegrees * Time.deltaTime;
            if (angleDegrees >= 360f)
            {
                angleDegrees -= 360f;
            }

            UpdatePose();
        }

        private void UpdatePose()
        {
            float radians = angleDegrees * Mathf.Deg2Rad;
            Vector3 offset = new Vector3(Mathf.Cos(radians), 0f, Mathf.Sin(radians)) * orbitRadius;
            transform.position = orbitCenter + offset + (Vector3.up * orbitHeight);
            transform.LookAt(orbitCenter + (Vector3.up * lookHeight));
        }
    }
}
