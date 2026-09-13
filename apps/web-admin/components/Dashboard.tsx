import type { FoundationResponse, VehicleStatus } from '@fa/shared';
import { formatDateTimeWib } from '@fa/shared';
import { Badge, Button, Card, EmptyState, Icon, StatCard } from '@fa/ui';

import { vehicleStatusMeta } from '../lib/foundation';

interface DashboardProps {
  foundation: FoundationResponse;
}

const fleetStatusOrder: ReadonlyArray<VehicleStatus> = [
  'RENTED',
  'AVAILABLE',
  'HELD',
  'MAINTENANCE',
  'INACTIVE',
];

const distributionClasses: Record<VehicleStatus, string> = {
  RENTED: 'bg-secondary',
  AVAILABLE: 'bg-primary',
  HELD: 'bg-warning',
  MAINTENANCE: 'bg-error',
  INACTIVE: 'bg-surface-highest',
};

export function Dashboard({ foundation }: DashboardProps) {
  const { vehicleCounts } = foundation;
  const totalVehicles = vehicleCounts.total;
  const rentedVehicles = vehicleCounts.byStatus.RENTED;
  const utilization = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : null;
  const isDemoPreview = vehicleCounts.demo > 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="flex flex-col gap-5 rounded-2xl bg-surface-lowest p-4 shadow-card sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge dot tone="info">
              Fondasi sistem
            </Badge>
            <span className="text-caption text-on-surface-variant">
              Diperiksa {formatDateTimeWib(foundation.checkedAt)}
            </span>
          </div>
          <h1 className="mt-4 text-headline-lg-mobile tracking-[-0.02em] text-on-surface sm:text-headline-lg">
            Pusat Kendali Operasional
          </h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Ringkasan inventaris armada dari fondasi sistem. Booking, pembayaran, dan operasional
            lanjutan belum tersedia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled icon="add" variant="primary">
            Booking manual · Fase 1
          </Button>
          <Button disabled icon="build" variant="outline">
            Operasional · Fase 3
          </Button>
        </div>
      </section>

      {isDemoPreview ? (
        <Card
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          padding="sm"
          tone="info"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-lowest text-on-secondary-fixed-variant">
              <Icon name="science" size="md" />
            </span>
            <div>
              <p className="text-body-md font-semibold text-on-surface">Pratinjau data contoh</p>
              <p className="mt-0.5 text-caption text-on-secondary-fixed-variant">
                Sebagian atau seluruh armada berasal dari seed fondasi; bukan indikator bisnis atau
                ketersediaan pemesanan saat ini.
              </p>
            </div>
          </div>
          <a
            className="text-body-md font-semibold text-on-secondary-fixed-variant underline-offset-4 hover:underline"
            href="/armada"
          >
            Lihat armada
          </a>
        </Card>
      ) : null}

      <section
        aria-label="Ringkasan operasional belum tersedia"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        <StatCard
          detail="Belum tersedia · Fase 1"
          icon="car_rental"
          label="Volume booking"
          value="—"
        />
        <StatCard
          detail="Belum tersedia · Fase 1"
          icon="notification_important"
          label="Tindakan mendesak"
          tone="danger"
          value="—"
        />
        <StatCard
          detail="Belum tersedia · Fase 1"
          icon="payments"
          label="Penerimaan kas"
          tone="success"
          value="—"
        />
        <StatCard
          detail="Belum tersedia · Fase 1"
          icon="sync_alt"
          label="Siklus sewa"
          tone="neutral"
          value="—"
        />
      </section>

      <section aria-labelledby="utilization-heading">
        <Card padding="md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant">
                <Icon name="directions_car" size="md" />
              </span>
              <div>
                <h2 className="text-title text-on-surface" id="utilization-heading">
                  Utilisasi Armada
                </h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Kapasitas {totalVehicles} unit terdaftar; berdasarkan status inventaris, bukan
                  ketersediaan booking.
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="tabular-nums text-headline-md text-on-surface">
                {utilization === null ? '—' : `${utilization}%`}
              </p>
              <p className="text-caption text-on-surface-variant">Berdasarkan status armada</p>
            </div>
          </div>
          {totalVehicles > 0 ? (
            <>
              <div
                aria-label="Distribusi status armada"
                className="mt-6 flex h-2 overflow-hidden rounded-full bg-surface"
              >
                {fleetStatusOrder.map((status) => {
                  const count = vehicleCounts.byStatus[status];

                  if (count === 0) {
                    return null;
                  }

                  return (
                    <span
                      className={distributionClasses[status]}
                      key={status}
                      style={{ width: `${(count / totalVehicles) * 100}%` }}
                      title={`${vehicleStatusMeta[status].label}: ${count}`}
                    />
                  );
                })}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                {fleetStatusOrder.map((status) => {
                  const count = vehicleCounts.byStatus[status];
                  const meta = vehicleStatusMeta[status];

                  return (
                    <div className="flex items-center gap-2" key={status}>
                      <span
                        aria-hidden
                        className={`size-2.5 rounded-full ${distributionClasses[status]}`}
                      />
                      <div>
                        <dt className="text-caption uppercase tracking-[0.04em] text-on-surface-variant">
                          {meta.label}
                        </dt>
                        <dd className="mt-0.5 text-body-md font-semibold tabular-nums text-on-surface">
                          {count} unit
                        </dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </>
          ) : (
            <p className="mt-6 rounded-xl bg-surface-low p-4 text-body-md text-on-surface-variant">
              Belum ada data armada untuk dihitung.
            </p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
        <Card padding="md">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-error-container text-on-error-container">
              <Icon name="priority_high" size="md" />
            </span>
            <div>
              <h2 className="text-title text-on-surface">Tindakan Mendesak</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Antrean booking dan verifikasi akan muncul pada Fase 1.
              </p>
            </div>
          </div>
          <EmptyState
            className="mt-5"
            description="Data booking dan pembayaran belum diimplementasikan, sehingga tidak ada tindakan yang dapat ditampilkan."
            icon="event_busy"
            title="Belum tersedia"
            action={
              <Button disabled size="sm" variant="outline">
                Booking · Fase 1
              </Button>
            }
          />
        </Card>
        <div className="space-y-4">
          <Card padding="md">
            <h2 className="text-title text-on-surface">Servis &amp; Legalitas</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Pengingat servis dan dokumen direncanakan pada Fase 3.
            </p>
            <EmptyState
              className="mt-5"
              description="Belum ada data servis atau dokumen untuk ditampilkan."
              icon="build"
              title="Belum tersedia"
            />
          </Card>
          <Card padding="md">
            <h2 className="text-title text-on-surface">Analitik Armada</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Peringkat armada dan pendapatan belum dihitung pada fase ini.
            </p>
            <EmptyState
              className="mt-5"
              description="Analitik operasional tersedia pada Fase 3."
              icon="monitoring"
              title="Belum tersedia"
            />
          </Card>
        </div>
      </section>

      <section aria-labelledby="schedule-heading">
        <Card padding="md">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-on-surface-variant">
              <Icon name="schedule" size="md" />
            </span>
            <div>
              <h2 className="text-title text-on-surface" id="schedule-heading">
                Jadwal Pengambilan &amp; Pengembalian
              </h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Jadwal hari ini belum tersedia sebelum modul booking dibangun.
              </p>
            </div>
          </div>
          <EmptyState
            className="mt-5"
            description="Tidak ada jadwal live yang ditampilkan pada fase Fondasi. Status ini bukan berarti tidak ada pemesanan."
            icon="calendar_month"
            title="Belum tersedia"
          />
        </Card>
      </section>
    </div>
  );
}
