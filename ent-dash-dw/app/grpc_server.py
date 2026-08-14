import logging
from sqlalchemy import text
import grpc
from typing import Any

from ent_dash_common.grpc import engine_pb2
from ent_dash_common.grpc import engine_pb2_grpc
from ent_dash_common.auth import validate_jwt_token
from ent_dash_common.exceptions import UnauthorizedException
from app.core.config import settings

from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


class DWService(engine_pb2_grpc.EngineServiceServicer):
    """
    gRPC service exposed by ent-dash-dw.
    Serves aggregated financial data from TABLEAU_REPORT schema in cbskonv.
    """

    async def GetFactKinerjaAggregate(self, request, context: grpc.aio.ServicerContext) -> engine_pb2.FactKinerjaResponse:
        logger.info("[gRPC] Received request for FactKinerjaAggregate")
        try:
            token = request.token
            if not token:
                logger.warning("[gRPC] Missing M2M token in request.")
                await context.abort(grpc.StatusCode.UNAUTHENTICATED, "Missing authentication token")
                return engine_pb2.FactKinerjaResponse()

            try:
                payload = validate_jwt_token(token, settings.SECRET_KEY, settings.ALGORITHM)
                if payload.get("type") != "service":
                    logger.warning("[gRPC] Token is not a service token.")
                    await context.abort(grpc.StatusCode.PERMISSION_DENIED, "Only service tokens are allowed")
            except UnauthorizedException as e:
                logger.error(f"[gRPC] Token validation failed: {e.message}")
                await context.abort(grpc.StatusCode.UNAUTHENTICATED, f"Invalid token: {e.message}")
                return engine_pb2.FactKinerjaResponse()

            async with AsyncSessionLocal() as db:
                # Check table exists in cbskonv TABLEAU_REPORT schema
                check_table = await db.execute(text("SELECT to_regclass('\"TABLEAU_REPORT\".fact_kinerjaprc')"))
                if not check_table.scalar():
                    return engine_pb2.FactKinerjaResponse(
                        status="error",
                        message="Tabel fact_kinerjaprc tidak ditemukan (belum ada impor data).",
                        data=[]
                    )

                date_result = await db.execute(text('SELECT MAX(periode_data) FROM "TABLEAU_REPORT".fact_kinerjaprc'))
                periode_data = date_result.scalar()

                aggregated_rows = []
                if periode_data:
                    query = text("""
                        SELECT
                            periode_data, keterangan, kelompok, jenis, urut, wil, nama_wil, cab, nama_cab, is_ajp,
                            SUM(nominal) as total_nominal, AVG(rasio) as avg_rasio
                        FROM "TABLEAU_REPORT".fact_kinerjaprc
                        WHERE periode_data = :periode_data
                        GROUP BY periode_data, keterangan, kelompok, jenis, urut, wil, nama_wil, cab, nama_cab, is_ajp
                    """)
                    result = await db.execute(query, {"periode_data": periode_data})
                    aggregated_rows = [dict(row) for row in result.mappings()]

            response_rows = []
            for row in aggregated_rows:
                pb_row = engine_pb2.FactKinerjaRow(
                    keterangan=str(row.get("keterangan", "")),
                    periode_data=str(row.get("periode_data", "")),
                    kelompok=str(row.get("kelompok", "")),
                    jenis=str(row.get("jenis", "")),
                    urut=str(row.get("urut", "")),
                    wil=str(row.get("wil", "")),
                    nama_wil=str(row.get("nama_wil", "")),
                    cab=str(row.get("cab", "")),
                    nama_cab=str(row.get("nama_cab", "")),
                    is_ajp=bool(row.get("is_ajp", False)),
                    total_nominal=float(row.get("total_nominal", 0.0) or 0.0),
                    avg_rasio=float(row.get("avg_rasio", 0.0) or 0.0)
                )
                response_rows.append(pb_row)

            logger.info(f"[gRPC] Successfully generated {len(response_rows)} aggregated rows")
            return engine_pb2.FactKinerjaResponse(
                status="success",
                message="OK",
                data=response_rows
            )

        except Exception as e:
            logger.error(f"[gRPC] Error generating aggregate: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return engine_pb2.FactKinerjaResponse(
                status="error",
                message=str(e),
                data=[]
            )


async def serve_grpc():
    server = grpc.aio.server()
    engine_pb2_grpc.add_EngineServiceServicer_to_server(DWService(), server)
    listen_addr = '[::]:50051'
    server.add_insecure_port(listen_addr)
    logger.info(f"[gRPC] DW gRPC server starting on {listen_addr}")
    await server.start()
    return server
