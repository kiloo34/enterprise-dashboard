from sqlalchemy import Column, String, BigInteger, Integer, Boolean, DateTime, Text
from app.db.base import Base


class EngineProcessGroup(Base):
    __tablename__ = "engine_process_group"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True)
    sts = Column(Boolean, nullable=True)
    group_name = Column(String(100), nullable=False)
    group_desc = Column(String(100), nullable=True)
    status_flag = Column(String(1), nullable=True)
    status_desc = Column(String(100), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String(11), nullable=True)
    last_connection = Column(DateTime, nullable=True)
    window_start = Column(String(8), nullable=True)
    window_end = Column(String(8), nullable=True)
    interval_minutes = Column(Integer, nullable=True)


class EngineProcessGroupHis(Base):
    __tablename__ = "engine_process_group_his"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True)
    sts = Column(Boolean, nullable=True)
    group_name = Column(String(100), nullable=False)
    group_desc = Column(String(100), nullable=True)
    status_flag = Column(String(1), nullable=True)
    status_desc = Column(String(100), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String(11), nullable=True)
    last_connection = Column(DateTime, nullable=True)
    window_start = Column(String(8), nullable=True)
    window_end = Column(String(8), nullable=True)
    interval_minutes = Column(Integer, nullable=True)


class EngineStsLoadData(Base):
    __tablename__ = "engine_sts_load_data"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True)
    sts = Column(Boolean, nullable=True)
    process_name = Column(String(100), nullable=True)
    process_desc = Column(String(100), nullable=True)
    group_id = Column(Integer, nullable=True)
    worker_id = Column(Integer, nullable=True)
    sort = Column(Integer, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String(11), nullable=True)
    is_ftp_sync = Column(Boolean, nullable=True)
    is_window_time = Column(Boolean, nullable=True)
    window_start = Column(String(8), nullable=True)
    window_end = Column(String(8), nullable=True)
    is_interval = Column(Boolean, nullable=True)
    interval_minutes = Column(Integer, nullable=True)
    job_location = Column(String(100), nullable=True)
    job_start_name = Column(String(100), nullable=True)
    status_flag = Column(String(1), nullable=True)
    status_desc = Column(String(100), nullable=True)
    count_src = Column(BigInteger, nullable=True)
    count_dest = Column(BigInteger, nullable=True)
    pentaho_id_job = Column(Integer, nullable=True)
    errors = Column(BigInteger, nullable=True)
    log_field = Column(Text, nullable=True)
    last_update_ftp = Column(DateTime, nullable=True)


class EngineStsLoadDataHis(Base):
    __tablename__ = "engine_sts_load_data_his"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True, nullable=True)
    sts = Column(Boolean, nullable=True)
    process_name = Column(String(100), nullable=True)
    process_desc = Column(String(100), nullable=True)
    group_id = Column(Integer, nullable=True)
    worker_id = Column(Integer, nullable=True)
    sort = Column(Integer, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String(11), nullable=True)
    is_ftp_sync = Column(Boolean, nullable=True)
    is_window_time = Column(Boolean, nullable=True)
    window_start = Column(String(8), nullable=True)
    window_end = Column(String(8), nullable=True)
    is_interval = Column(Boolean, nullable=True)
    interval_minutes = Column(Integer, nullable=True)
    job_location = Column(String(100), nullable=True)
    job_start_name = Column(String(100), nullable=True)
    status_flag = Column(String(1), nullable=True)
    status_desc = Column(String(100), nullable=True)
    count_src = Column(BigInteger, nullable=True)
    count_dest = Column(BigInteger, nullable=True)
    pentaho_id_job = Column(Integer, nullable=True)
    errors = Column(BigInteger, nullable=True)
    log_field = Column(Text, nullable=True)
    last_update_ftp = Column(DateTime, nullable=True)


class EngineStsProseRpt(Base):
    __tablename__ = "engine_sts_proses_rpt"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True)
    sts = Column(Boolean, nullable=True)
    process_name = Column(String(100), nullable=True)
    process_desc = Column(String(100), nullable=True)
    group_id = Column(Integer, nullable=True)
    worker_id = Column(Integer, nullable=True)
    sort = Column(Integer, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String(11), nullable=True)
    is_ftp_sync = Column(Boolean, nullable=True)
    is_window_time = Column(Boolean, nullable=True)
    window_start = Column(String(8), nullable=True)
    window_end = Column(String(8), nullable=True)
    is_interval = Column(Boolean, nullable=True)
    interval_minutes = Column(Integer, nullable=True)
    job_location = Column(String(100), nullable=True)
    job_start_name = Column(String(100), nullable=True)
    status_flag = Column(String(1), nullable=True)
    status_desc = Column(String(50), nullable=True)
    pentaho_id_job = Column(Integer, nullable=True)
    errors = Column(BigInteger, nullable=True)
    log_field = Column(Text, nullable=True)
    last_update_ftp = Column(DateTime, nullable=True)


class EngineStsProseRptHis(Base):
    __tablename__ = "engine_sts_proses_rpt_his"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True, nullable=True)
    sts = Column(Boolean, nullable=True)
    process_name = Column(String(100), nullable=True)
    process_desc = Column(String(100), nullable=True)
    group_id = Column(Integer, nullable=True)
    worker_id = Column(Integer, nullable=True)
    sort = Column(Integer, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String(11), nullable=True)
    is_ftp_sync = Column(Boolean, nullable=True)
    is_window_time = Column(Boolean, nullable=True)
    window_start = Column(String(8), nullable=True)
    window_end = Column(String(8), nullable=True)
    is_interval = Column(Boolean, nullable=True)
    interval_minutes = Column(Integer, nullable=True)
    job_location = Column(String(100), nullable=True)
    job_start_name = Column(String(100), nullable=True)
    status_flag = Column(String(1), nullable=True)
    status_desc = Column(String(50), nullable=True)
    pentaho_id_job = Column(Integer, nullable=True)
    errors = Column(BigInteger, nullable=True)
    log_field = Column(Text, nullable=True)
    last_update_ftp = Column(DateTime, nullable=True)



class EngineJobEntryLog(Base):
    __tablename__ = "engine_job_entry_log"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_batch = Column(Integer, nullable=True)
    channel_id = Column(String(255), nullable=True)
    log_date = Column(DateTime, nullable=True)
    transname = Column(String(255), nullable=True)
    stepname = Column(String(255), nullable=True)
    lines_read = Column(BigInteger, nullable=True)
    lines_written = Column(BigInteger, nullable=True)
    lines_updated = Column(BigInteger, nullable=True)
    lines_input = Column(BigInteger, nullable=True)
    lines_output = Column(BigInteger, nullable=True)
    lines_rejected = Column(BigInteger, nullable=True)
    errors = Column(BigInteger, nullable=True)
    result = Column(String(5), nullable=True)
    nr_result_rows = Column(BigInteger, nullable=True)
    nr_result_files = Column(BigInteger, nullable=True)


class EngineJobLog(Base):
    __tablename__ = "engine_job_log"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_job = Column(Integer, nullable=True)
    channel_id = Column(String(255), nullable=True)
    jobname = Column(String(255), nullable=True)
    status = Column(String(15), nullable=True)
    lines_read = Column(BigInteger, nullable=True)
    lines_written = Column(BigInteger, nullable=True)
    lines_updated = Column(BigInteger, nullable=True)
    lines_input = Column(BigInteger, nullable=True)
    lines_output = Column(BigInteger, nullable=True)
    lines_rejected = Column(BigInteger, nullable=True)
    errors = Column(BigInteger, nullable=True)
    startdate = Column(DateTime, nullable=True)
    enddate = Column(DateTime, nullable=True)
    logdate = Column(DateTime, nullable=True)
    depdate = Column(DateTime, nullable=True)
    replaydate = Column(DateTime, nullable=True)
    log_field = Column(Text, nullable=True)


class EngineSettingDb(Base):
    __tablename__ = "engine_setting_db"
    __table_args__ = {"schema": "rekon"}

    id = Column(Integer, primary_key=True)
    sts = Column(Boolean, nullable=True)
    connection_name = Column(String(50), nullable=True)
    connection_desc = Column(String(100), nullable=True)
    rdbms = Column(String(50), nullable=True)
    host_name = Column(String(50), nullable=True)
    database_name = Column(String(50), nullable=True)
    port_number = Column(String(50), nullable=True)
    username = Column(String(50), nullable=True)
    password = Column(String(50), nullable=True)
