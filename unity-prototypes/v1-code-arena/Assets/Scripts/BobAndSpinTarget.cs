using UnityEngine;

namespace Canuter.UnityV1
{
    public sealed class BobAndSpinTarget : MonoBehaviour
    {
        public float bobAmplitude = 0.35f;
        public float bobSpeed = 1.5f;
        public float spinSpeedDegrees = 90f;
        public float phaseOffset;

        private Vector3 startPosition;

        private void Start()
        {
            startPosition = transform.position;
        }

        private void Update()
        {
            float wave = Mathf.Sin((Time.time + phaseOffset) * bobSpeed) * bobAmplitude;
            transform.position = startPosition + (Vector3.up * wave);
            transform.Rotate(Vector3.up, spinSpeedDegrees * Time.deltaTime, Space.World);
        }
    }
}
